const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const GroupMember = sequelize.define('GroupMember', {
        group_member_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        group_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {
        timestamps: true,
        createdAt: 'joined_at',
    });

    GroupMember.associate = (models) => {
        GroupMember.belongsTo(models.Group, { foreignKey: 'group_id' });
        GroupMember.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return GroupMember;
};