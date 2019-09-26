/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('transfer', {
        transactionId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: 'transaction_id',
            primaryKey: true,
            autoIncrement: true,
        },
		senderId: {
			type: DataTypes.BIGINT,
			allowNull: false,
			defaultValue: 'nextval(transfer_sender_id_seq::regclass)',
			references: {
				model: 'user',
				key: 'user_id'
			},
			field: 'sender_id'
		},
		receiverId: {
			type: DataTypes.BIGINT,
			allowNull: false,
			defaultValue: 'nextval(transfer_receiver_id_seq::regclass)',
			references: {
				model: 'user',
				key: 'user_id'
			},
			field: 'receiver_id'
		},
		amount: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			field: 'amount'
		}
	}, {
		tableName: 'transfer'
	});
};
