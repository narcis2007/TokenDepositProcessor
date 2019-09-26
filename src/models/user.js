/* jshint indent: 1 */

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('user', {
            userId: {
                type: DataTypes.BIGINT,
                allowNull: false,
                field: 'user_id',
                primaryKey: true,
                autoIncrement: true,
            }, balance: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                defaultValue: 0,
                field: 'balance'
            }, depositPrivateKey: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true,
                field: 'deposit_private_key'
            }, depositAddress: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true,
                field: 'deposit_address'
            }
        },
        {
            tableName: 'user'
        }
    );
};
