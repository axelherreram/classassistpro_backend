const { Clase, Estudiante, Sesion, Asistencia, Participacion } = require('../models');

const obtenerRanking = async (req, res) => {
  try {
    const { claseId, sesionId } = req.params;
    const catedraticoId = req.user.id;

    let claseIdToUse = claseId;

    if (sesionId) {
      const sesionInfo = await Sesion.findOne({ where: { id: sesionId } });     
      if (!sesionInfo) return res.status(404).json({ error: 'Sesión no encontrada' });
      claseIdToUse = sesionInfo.claseId;
    }

    // Validate class and permissions
    const clase = await Clase.findOne({
      where: { id: claseIdToUse, catedraticoId },
      include: [
        {
          model: Estudiante,
          attributes: ['id', 'nombre', 'carnet']
        },
        {
          model: Sesion,
          attributes: ['id']
        }
      ]
    });

    if (!clase) {
      return res.status(404).json({ error: 'Clase no encontrada o sin permisos' });
    }

    const estudiantes = clase.Estudiantes || [];
    const sesionesIds = sesionId ? [parseInt(sesionId)] : (clase.Sesions ? clase.Sesions.map(s => s.id) : []);

    const ranking = [];

    // Optimize by fetching all data for the class first
    const asistencias = await Asistencia.findAll({
      where: { sesionId: sesionesIds, presente: true }
    });

    const participaciones = await Participacion.findAll({
      where: { sesionId: sesionesIds }
    });

    for (const est of estudiantes) {
      // 1. Asistencias
      const asistenciasEstudiante = asistencias.filter(a => a.estudianteId === est.id);
      
      // Asistencia normal = 10 pts, Asistencia tarde = 5 pts (la mitad)
      const puntosAsistencia = asistenciasEstudiante.reduce((sum, a) => sum + (a.tarde ? 5 : 10), 0);

      // 2. Participaciones
      const participacionesEstudiante = participaciones.filter(p => p.estudianteId === est.id);
      const puntosParticipacion = participacionesEstudiante.reduce((sum, p) => sum + (Number(p.puntos) || 0), 0);

      const puntajeTotal = puntosAsistencia + puntosParticipacion;

      ranking.push({
        estudiante: {
          id: est.id,
          nombre: est.nombre,
          carnet: est.carnet
        },
        detalles: {
          asistencias: asistenciasEstudiante.length,
          puntosAsistencia,
          participaciones: participacionesEstudiante.length,
          puntosParticipacion
        },
        puntajeTotal
      });
    }

    // Sort mostly by total score descending
    ranking.sort((a, b) => b.puntajeTotal - a.puntajeTotal);

    res.json({
      clase: clase.nombre,
      claseId: clase.id,
      ranking
    });
  } catch (error) {
    console.error('Error al obtener ranking:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  obtenerRanking
};
