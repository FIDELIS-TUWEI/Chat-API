const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const GroupMessage = sequelize.define('GroupMessage', {
        group_message_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        group_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sender_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
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

    GroupMessage.associate = (models) => {
        GroupMessage.belongsTo(models.Group, { foreignKey: 'group_id' });
        GroupMessage.belongsTo(models.User, { foreignKey: 'sender_id' });
    };

    return GroupMessage;
};