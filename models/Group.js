const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Group = sequelize.define('Group', {
        group_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        group_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        group_picture: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    Group.associate = (models) => {
        Group.belongsTo(models.User, { foreignKey: 'created_by' });
        Group.hasMany(models.GroupMessage, { foreignKey: 'group_id' });
    };

    return Group;
};