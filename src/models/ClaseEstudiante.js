const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClaseEstudiante = sequelize.define('ClaseEstudiante', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  claseId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'clases',
      key: 'id'
    }
  },
  estudianteId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'estudiantes',
      key: 'id'
    }
  }
}, {
  tableName: 'clase_estudiantes',
  indexes: [
    {
      unique: true,
      fields: ['claseId', 'estudianteId']
    }
  ]
});

module.exports = ClaseEstudiante;
