const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Estudiante = sequelize.define('Estudiante', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  carnet: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: "carnet"
  },
  correo: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'estudiantes'
});

module.exports = Estudiante;
