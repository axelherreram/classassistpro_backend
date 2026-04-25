const { Sesion, Asistencia, Estudiante, Participacion, Clase } = require('../models');

/**
 * 1. Obtener la Ruleta de Participación (Lista de presentes y un alumno seleccionado al azar)
 * Endpoint para que el Frontend anime su ruleta y ya sepa quién ganará
 */
const generarRuleta = async (req, res) => {
  try {
    const { sesionId } = req.params;
    const catedraticoId = req.user.id;

    // Verificar si la sesión pertenece al catedrático actual
    const sesion = await Sesion.findByPk(sesionId, { include: Clase });
    
    if (!sesion) {
        return res.status(404).json({ error: 'Sesión no encontrada.' });
    }
    if (sesion.Clase.catedraticoId !== catedraticoId) {
        return res.status(403).json({ error: 'No tienes permiso para acceder a esta sesión.' });
    }
    if (sesion.estado === 'finalizada') {
        return res.status(400).json({ error: 'No se puede usar la ruleta porque la sesión ya está finalizada.' });
    }

    // Buscar a todos los estudiantes que registraron asistencia en esta sesión
    const asistencias = await Asistencia.findAll({
      where: { sesionId, presente: true },
      include: [{
        model: Estudiante,
        attributes: ['id', 'nombre', 'carnet']
      }]
    });

    if (asistencias.length === 0) {
      return res.status(400).json({ error: 'No hay estudiantes que hayan registrado asistencia en esta sesión.' });
    }

    // Extraemos solo el arreglo de estudiantes
    const estudiantesPresentes = asistencias.map(a => a.Estudiante);

    // Seleccionamos ganador al azar en el backend para evitar que el front pueda manipularlo
    const indiceAleatorio = Math.floor(Math.random() * estudiantesPresentes.length);
    const ganador = estudiantesPresentes[indiceAleatorio];

    res.json({
      mensaje: 'Ruleta generada exitosamente. Usa "presentes" para animar y "seleccionado" como el resultado de tu animación.',
      seleccionado: ganador,
      presentes: estudiantesPresentes,
      totalParticipantes: estudiantesPresentes.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar la ruleta de participación.' });
  }
};

/**
 * 2. Registrar calificación de la participación del estudiante seleccionado
 */
const registrarParticipacion = async (req, res) => {
  try {
    const { sesionId } = req.params;
    const { estudianteId, puntos, descripcion } = req.body;
    const catedraticoId = req.user.id;

    // Validar propiedad de la sesión y clase
    const sesion = await Sesion.findByPk(sesionId, { include: Clase });
    if (!sesion || sesion.Clase.catedraticoId !== catedraticoId) {
        return res.status(403).json({ error: 'Sesión no válida o sin permisos.' });
    }
    if (sesion.estado === 'finalizada') {
        return res.status(400).json({ error: 'No se puede registrar participación porque la sesión ya está finalizada.' });
    }

    if (!estudianteId || puntos == null) {
        return res.status(400).json({ error: 'El estudiante y los puntos son requeridos para la evaluación.' });
    }

    // Asegurarse de que el estudiante realmente asistió a la clase 
    // y fue uno de los presentes
    const asistenciaValida = await Asistencia.findOne({
        where: { sesionId, estudianteId, presente: true }
    });

    if (!asistenciaValida) {
        return res.status(400).json({ error: 'No puedes calificar a un estudiante que no registró su asistencia en esta sesión.' });
    }

    // Crear el registro de su participación sumando puntos al acumulado
    const nuevaParticipacion = await Participacion.create({
        descripcion: descripcion || 'Participación en clase mediante ruleta.',
        puntos,
        estudianteId,
        sesionId
    });

    res.status(201).json({
        message: 'Participación calificada y registrada correctamente.',
        participacion: nuevaParticipacion
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar la calificación de participación.' });
  }
};

/**
 * 3. Obtener el historial de participaciones de una sesión
 */
const getParticipacionesPorSesion = async (req, res) => {
    try {
        const { sesionId } = req.params;
        const catedraticoId = req.user.id;
    
        const sesion = await Sesion.findByPk(sesionId, { include: Clase });
        if (!sesion || sesion.Clase.catedraticoId !== catedraticoId) {
            return res.status(403).json({ error: 'Sesión no válida o sin permisos.' });
        }
    
        const participaciones = await Participacion.findAll({
            where: { sesionId },
            include: [{
                model: Estudiante,
                attributes: ['id', 'nombre', 'carnet']
            }],
            order: [['createdAt', 'DESC']]
        });
    
        res.json({ participaciones });
    
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el historial de participaciones.' });
      }
}


module.exports = {
  generarRuleta,
  registrarParticipacion,
  getParticipacionesPorSesion
};
