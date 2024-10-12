const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Message = sequelize.define('Message', {
        message_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        sender_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        recipient_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        file_url: {
            type: DataTypes.STRING(255),
            allowNull: true,
        }
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    Message.associate = (models) => {
        Message.belonsTo(models.User, { foreignKey: 'sender_id' });
        Message.belonsTo(models.User, { foreignKey: 'recipient_id' });
    };

    return Message;
};