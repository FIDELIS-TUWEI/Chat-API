const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING(50),
            unique: true,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(100),
            unique: true,
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        profile_picture: {
            type: DataTypes.STRING(255)
        },
        is_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        mfa_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'User', 
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    User.associate = (models) => {
        User.hasMany(models.Message, { foreignKey: 'sender_id' });
        User.hasMany(models.Friendship, { foreignKey: 'user_id' });
        User.hasMany(models.GroupMessage, { foreignKey: 'sender_id' });
        User.hasMany(models.Notification, { foreignKey: 'user_id' });
    };

    return User;
}