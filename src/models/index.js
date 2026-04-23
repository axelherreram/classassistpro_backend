const Asistencia = require('./Asistencia');
const Catedratico = require('./Catedratico');
const Clase = require('./Clase');
const Estudiante = require('./Estudiante');
const Grupo = require('./Grupo');
const GrupoEstudiante = require('./GrupoEstudiante');
const Participacion = require('./Participacion');
const Sesion = require('./Sesion');
const ClaseEstudiante = require('./ClaseEstudiante'); // Importamos la nueva tabla intermedia

// Asociaciones
Catedratico.hasMany(Clase, { foreignKey: 'catedraticoId' });
Clase.belongsTo(Catedratico, { foreignKey: 'catedraticoId' });

// Relación N:M Estudiantes <-> Clases (Para normalizar, un estudiante puede estar en varias clases)
Clase.belongsToMany(Estudiante, { through: ClaseEstudiante, foreignKey: 'claseId' });
Estudiante.belongsToMany(Clase, { through: ClaseEstudiante, foreignKey: 'estudianteId' });

Clase.hasMany(Sesion, { foreignKey: 'claseId' });
Sesion.belongsTo(Clase, { foreignKey: 'claseId' });

Sesion.hasMany(Asistencia, { foreignKey: 'sesionId' });
Asistencia.belongsTo(Sesion, { foreignKey: 'sesionId' });

Estudiante.hasMany(Asistencia, { foreignKey: 'estudianteId' });
Asistencia.belongsTo(Estudiante, { foreignKey: 'estudianteId' });

Estudiante.hasMany(Participacion, { foreignKey: 'estudianteId' });
Participacion.belongsTo(Estudiante, { foreignKey: 'estudianteId' });

Sesion.hasMany(Participacion, { foreignKey: 'sesionId' });
Participacion.belongsTo(Sesion, { foreignKey: 'sesionId' });

Sesion.hasMany(Grupo, { foreignKey: 'sesionId' });
Grupo.belongsTo(Sesion, { foreignKey: 'sesionId' });

// Relación N:M Estudiantes <-> Grupos
Estudiante.belongsToMany(Grupo, { through: GrupoEstudiante, foreignKey: 'estudianteId' });
Grupo.belongsToMany(Estudiante, { through: GrupoEstudiante, foreignKey: 'grupoId' });

module.exports = {
  Asistencia,
  Catedratico,
  Clase,
  ClaseEstudiante,
  Estudiante,
  Grupo,
  GrupoEstudiante,
  Participacion,
  Sesion
};
