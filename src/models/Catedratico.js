const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Catedratico = sequelize.define('Catedratico', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  correo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: "correo"
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  actualizoContra: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  rol: {
    type: DataTypes.ENUM('ADMIN', 'CATEDRATICO'),
    defaultValue: 'CATEDRATICO'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'catedraticos'
});

module.exports = Catedratico;
