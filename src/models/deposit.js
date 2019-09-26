/* jshint indent: 1 */

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('deposit', {
        depositId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: 'deposit_id',
            primaryKey: true,
            autoIncrement: true,
        },
        amount: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            field: 'amount'
        },
        transactionHash: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            field: 'transaction_hash'
        },//TODO: add block time to handle confirmations in it and a new field "confirmed"
        blockNumber: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: 'block_number',
        },
        confirmed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'confirmed',
        },
        userId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'user',
                key: 'user_id'
            },
            field: 'user_id'
        },
        status: {
            type: DataTypes.SMALLINT,
            allowNull: true,
            field: 'status'
        }
    }, {
        tableName: 'deposit'
    });
};
