/* jshint indent: 1 */

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('block', {
            blockID: {
                type: DataTypes.BIGINT,
                allowNull: false,
                field: 'block_id',
                primaryKey: true,
                autoIncrement: true,
            }, lastProcessedBlockNumber: {
                type: DataTypes.BIGINT,
                allowNull: false,
                defaultValue: 0,
                field: 'last_processed_block_number'
            }
        },
        {
            tableName: 'block'
        }
    );
};
