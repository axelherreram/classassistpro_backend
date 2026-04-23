const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Participacion = sequelize.define('Participacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  puntos: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  estudianteId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'estudiantes',
      key: 'id'
    }
  },
  sesionId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'sesiones',
      key: 'id'
    }
  }
}, {
  tableName: 'participaciones'
});

module.exports = Participacion;
