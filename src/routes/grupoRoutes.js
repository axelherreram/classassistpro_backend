const express = require('express');
const router = express.Router();
const grupoController = require('../controllers/grupoController');
const { verifyToken, isCatedratico } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.use(isCatedratico);

/**
 * @swagger
 * tags:
 *   name: Grupos
 *   description: Herramienta para la generación aleatoria de grupos en una sesión y su calificación
 */

/**
 * @swagger
 * /api/grupos/sesion/{sesionId}/generar:
 *   post:
 *     summary: Generar grupos aleatorios a partir de los asistentes de la sesión
 *     tags: [Grupos]
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
 *               - tipo
 *               - cantidad
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [grupos, estudiantes]
 *                 description: Define si la cantidad representa el límite de grupos ('grupos') o el máximo de estudiantes por grupo ('estudiantes')
 *               cantidad:
 *                 type: integer
 *                 description: Cantidad numérica utilizada según el tipo especificado
 *     responses:
 *       200:
 *         description: Grupos generados exitosamente
 *       400:
 *         description: Parámetros inválidos o no hay estudiantes presentes
 *       403:
 *         description: Sesión no válida o sin permisos
 */
router.post('/sesion/:sesionId/generar', grupoController.generarGrupos);        

/**
 * @swagger
 * /api/grupos/sesion/{sesionId}:
 *   get:
 *     summary: Obtener los grupos generados en una sesión
 *     tags: [Grupos]
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
 *         description: Lista de grupos y sus integrantes
 *       403:
 *         description: Sesión no válida o sin permisos
 */
router.get('/sesion/:sesionId', grupoController.obtenerGrupos);

/**
 * @swagger
 * /api/grupos/{grupoId}/calificar:
 *   post:
 *     summary: Aplicar una calificación a todos los integrantes de un grupo
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grupoId
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
 *               - puntos
 *             properties:
 *               puntos:
 *                 type: number
 *                 description: Cantidad de puntos a otorgar (se registrarán como participación)
 *               descripcion:
 *                 type: string
 *                 description: Justificación o actividad por la cual se da la calificación
 *     responses:
 *       200:
 *         description: Calificación aplicada exitosamente
 *       400:
 *         description: Falta especificar los puntos
 *       403:
 *         description: Grupo no válido o sin permisos
 */
router.post('/:grupoId/calificar', grupoController.calificarGrupo);

module.exports = router;
