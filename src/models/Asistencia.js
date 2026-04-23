const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Asistencia = sequelize.define('Asistencia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  presente: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tarde: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sesionId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'sesiones',
      key: 'id'
    }
  },
  estudianteId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'estudiantes',
      key: 'id'
    }
  },
  foto: {
    type: DataTypes.STRING(1000), 
    allowNull: true
  }
}, {
  tableName: 'asistencias',
  indexes: [
    {
      unique: true,
      fields: ['sesionId', 'estudianteId'],
      name: 'unique_asistencia_por_sesion'
    }
  ]
});

module.exports = Asistencia;
