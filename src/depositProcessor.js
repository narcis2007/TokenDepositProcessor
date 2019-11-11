const Sequelize = require("sequelize");
const Web3 = require('web3');
const sleep = require('system-sleep');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER));
const Models = require('@narcis2007/ipour-models');

Models.syncDB(false);

const Block = Models.Block;
const Deposit = Models.Deposit;
const User = Models.User;
const Transfer = Models.Transfer;

var tokenContract = new web3.eth.Contract(require('./ERC20ABI.json'), process.env.TOKEN_ADDRESS);


async function processDepositConfirmations() {

    var latestBlockNumber = (await web3.eth.getBlockNumber());
    var confirmationBlockNumber = latestBlockNumber - 12;

    var pendingDeposits = await Deposit.findAll({
        where: {
            blockNumber: {
                [Sequelize.Op.lt]: confirmationBlockNumber
            }, confirmed: false
        }
    });
    for (var i = 0; i < pendingDeposits.length; i++) {
        if (latestBlockNumber - (await web3.eth.getTransaction(pendingDeposits[i].transactionHash)).blockNumber > 12) { //confirmed
            pendingDeposits[i].confirmed = true;
            pendingDeposits[i].save();

            console.log(`deposit ${pendingDeposits[i].depositId} confirmed`)

            var fee = 0;
            var user = (await User.findByPk(pendingDeposits[i].userId));

            if (user.hasCustomDepositFee) {
                fee = pendingDeposits[i].amount * user.customDepositFee / 100;
            } else {
                fee = pendingDeposits[i].amount * process.env.DEPOSIT_FEE_PERCENTAGE / 100;
            }

            user.balance += (pendingDeposits[i].amount - fee);// TODO: add transfer event for external deposit
            user.save();
            console.log(`balance updated for user ${user.userId}`);

            if (fee !== 0) {

                var feeCollectorUser = (await User.findByPk(Models.Constants.FEE_COLLECTOR_USER_ID));
                feeCollectorUser.balance += fee;
                feeCollectorUser.save();
                await Transfer.build({
                    amount: fee,
                    receiverId: feeCollectorUser.userId,
                    senderId: pendingDeposits[i].userId
                }).save();
                console.log(`Fee collected from user ${user.userId}`);
            }

        }
    }

}

async function processDeposits() {

    var latestBlockNumber = await web3.eth.getBlockNumber(); // TODO: use less await and let the processes run more in parallel
    console.log('latestBlockNumber: ' + latestBlockNumber);
    var fromBlock = parseInt((await Block.findByPk(Models.Constants.ETHEREUM_LAST_PROCESSED_BLOCK_ID)).lastProcessedBlockNumber) + 1;
    console.log('fromBlock: ' + fromBlock)
    if (fromBlock <= latestBlockNumber) {
        var hotWalletEvents = await tokenContract.getPastEvents('Transfer', {
            // filter: {to: process.env.HOT_WALLET_ADDRESS},
            fromBlock: fromBlock,
            toBlock: latestBlockNumber
        });

        for (var i = 0; i < hotWalletEvents.length; i++) {
            var event = hotWalletEvents[i];
            // TODO: if receiving address is in our DB add deposit


            var users = await User.findAll({
                where: {
                    depositAddress: event.returnValues.to
                }
            });

            if (users.length === 1) {
                console.log(`Detected deposit to user ${users[0].userId}`);
                Deposit.build({
                    amount: event.returnValues.value / 10 ** 8,
                    transactionHash: event.transactionHash,
                    blockNumber: event.blockNumber,
                    userId: users[0].userId
                }).save();
            }
        }

        await Block.update(
            {lastProcessedBlockNumber: latestBlockNumber},
            {where: {blockId: Models.Constants.ETHEREUM_LAST_PROCESSED_BLOCK_ID}}
        );
    }
};

function run() {
    try {
        while (true) {
            processDepositConfirmations();
            processDeposits();
            sleep(process.env.SCAN_INTERVAL);
        }

    } catch (err) {
        console.log(err);
    }
}

run();