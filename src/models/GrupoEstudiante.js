const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GrupoEstudiante = sequelize.define('GrupoEstudiante', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  grupoId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'grupos',
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
  tableName: 'grupo_estudiantes',
  indexes: [
    {
      unique: true,
      fields: ['estudianteId', 'grupoId']
    }
  ]
});

module.exports = GrupoEstudiante;
