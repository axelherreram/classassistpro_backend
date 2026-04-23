const express = require('express');
const { 
  generarRuleta, 
  registrarParticipacion, 
  getParticipacionesPorSesion 
} = require('../controllers/participacionController');
const { verifyToken, isCatedratico } = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas las rutas de participación requieren permisos de catedrático
router.use(verifyToken, isCatedratico);

/**
 * @swagger
 * tags:
 *   name: Participaciones (Ruleta)
 *   description: Herramienta interactiva para seleccionar estudiantes participativos y evaluarlos
 */

/**
 * @swagger
 * /api/participaciones/sesion/{sesionId}/ruleta:
 *   get:
 *     summary: Genera una selección de ruleta entre los asistentes de una sesión
 *     description: Retorna la lista de todos los estudiantes presentes para alimentar la animación de la ruleta en el frontend, y además entrega pre-seleccionado aleatoriamente al "estudiante ganador".
 *     tags: [Participaciones (Ruleta)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sesionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de asistentes y el estudiante "seleccionado"
 *       400:
 *         description: No hay estudiantes que hayan marcado asistencia en esta sesión
 */
router.get('/sesion/:sesionId/ruleta', generarRuleta);

/**
 * @swagger
 * /api/participaciones/sesion/{sesionId}:
 *   post:
 *     summary: Evaluar y calificar al estudiante que participó en clase
 *     tags: [Participaciones (Ruleta)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sesionId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estudianteId
 *               - puntos
 *             properties:
 *               estudianteId:
 *                 type: integer
 *               puntos:
 *                 type: integer
 *                 description: Por ejemplo, 1 o más puntos positivos, o 0 si no supo responder.
 *               descripcion:
 *                 type: string
 *                 description: Opcional. "Respondió la pregunta 1 correctamente."
 *     responses:
 *       201:
 *         description: Registro de participación guardado
 */
router.post('/sesion/:sesionId', registrarParticipacion);

/**
 * @swagger
 * /api/participaciones/sesion/{sesionId}:
 *   get:
 *     summary: Obtener el historial completo de participaciones evaluadas en una sesión específica
 *     tags: [Participaciones (Ruleta)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sesionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de calificaciones realizadas
 */
router.get('/sesion/:sesionId', getParticipacionesPorSesion);


module.exports = router;
