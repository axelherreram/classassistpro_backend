const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sesion = sequelize.define('Sesion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  tema: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  qrToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('creada', 'finalizada'),
    defaultValue: 'creada',
    allowNull: false
  },
  claseId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'clases',
      key: 'id'
    }
  }
}, {
  tableName: 'sesiones'
});

module.exports = Sesion;
