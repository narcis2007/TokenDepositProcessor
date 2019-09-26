const Sequelize = require("sequelize");
const Web3 = require('web3');
const sleep = require('system-sleep');
const web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/3d1dacbcaeb34ea889ae105c15220e08'));

const sequelize = new Sequelize(`postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`, {
    define: {
        timestamps: false
    }
});
// sequelize.sync();//{force:true}

const Block = require("./models/block.js")(sequelize, Sequelize.DataTypes);
const Deposit = require("./models/deposit.js")(sequelize, Sequelize.DataTypes);
const User = require("./models/user.js")(sequelize, Sequelize.DataTypes);

// User.sync({force:true});

var tokenContract = new web3.eth.Contract(require('./ERC20ABI.json'), process.env.TOKEN_ADDRESS);


async function processDepositConfirmations() {
    while (true) {
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
                var user = (await User.findByPk(pendingDeposits[i].userId));
                user.balance += pendingDeposits[i].amount;
                user.save();
                console.log(`balance updated for user ${user.userId}, added ${pendingDeposits[i].amount}`)
            }
        }
        await sleep(process.env.SCAN_INTERVAL);
    }
}

async function processDeposits() {
    while (true) {
        var latestBlockNumber = await web3.eth.getBlockNumber();
        console.log('latestBlockNumber: ' + latestBlockNumber);
        var fromBlock = parseInt((await Block.findByPk(1)).lastProcessedBlockNumber) + 1;
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
                {where: {blockID: 1}}
            );
        }

        await sleep(process.env.SCAN_INTERVAL);
    }
};

async function run() {
    try {

        processDepositConfirmations();

        processDeposits();

    } catch (err) {
        console.log(err);
    }
}

run();