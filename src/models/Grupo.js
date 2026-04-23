const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Grupo = sequelize.define('Grupo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  sesionId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'sesiones',
      key: 'id'
    }
  }
}, {
  tableName: 'grupos'
});

module.exports = Grupo;
