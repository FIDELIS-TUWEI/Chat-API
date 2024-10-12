const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Notification = sequelize.define('Notification', {
        notification_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        message: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING(50),  // friend_request, message, etc.
            allowNull: false,
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        timestamps: true,
        createdAt: 'created_at',
    });

    Notification.associate = (models) => {
        Notification.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return Notification;
};