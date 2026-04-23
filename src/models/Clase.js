const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Clase = sequelize.define('Clase', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  catedraticoId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'catedraticos',
      key: 'id'
    }
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Campo para borrado lógico'
  }
}, {
  tableName: 'clases'
});

module.exports = Clase;
