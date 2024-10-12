const { DataTypes } = require("sequelize");
const { sequelize } = require(".");

module.exports = (sequelize) => {
    const Friendship = sequelize.define('Friendship', {
        friendship_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        friend_user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'accepted', 'declined'),
            defaultValue: 'pending'
        }
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    Friendship.associate = (models) => {
        Friendship.belongsTo(models.User, { foreignKey: 'user_id' });
        Friendship.belongsTo(models.User, { foreignKey: 'friend_user_id' });
    };

    return Friendship;
};