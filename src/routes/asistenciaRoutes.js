const express = require('express');
const { 
  generarQRSesion, 
  marcarAsistencia, 
  getAsistenciaPorSesion,
  crearSesion,
  getSesionesPorClase,
  finalizarSesion
} = require('../controllers/asistenciaController');
const { verifyToken, isCatedratico } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Asistencias
 *   description: Módulo de Asistencia autónomo mediante Códigos QR
 */

/**
 * @swagger
 * /api/asistencias/marcar:
 *   post:
 *     summary: (ESTUDIANTES) Registrar asistencia escaneando el código QR
 *     description: Endpoint público/autónomo, lee el "token" extraído del QR y el carnet del estudiante que lo escanea. El Timestamp se genera dinámicamente en DB.
 *     tags: [Asistencias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - carnet
 *               - foto
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token JWT decodificado por el lector de QR
 *               carnet:
 *                 type: string
 *                 description: Carnet del estudiante
 *               foto:
 *                 type: string
 *                 description: Base64 string de la foto/selfie del estudiante
 *     responses:
 *       201:
 *         description: Asistencia registrada con éxito
 *       400:
 *         description: Ya ha registrado su asistencia (Evita duplicados)
 *       401:
 *         description: El QR ha expirado (Token inválido o expirado)
 */
router.post('/marcar', marcarAsistencia);


// ----- RUTAS EXCLUSIVAS PARA EL CATEDRÁTICO -----
router.use(verifyToken, isCatedratico);

/**
 * @swagger
 * /api/asistencias/sesion:
 *   post:
 *     summary: Crear una sesión de clase
 *     tags: [Asistencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - claseId
 *             properties:
 *               claseId:
 *                 type: integer
 *               fecha:
 *                 type: string
 *                 format: date
 *                 description: "YYYY-MM-DD"
 *               tema:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sesión creada
 */
router.post('/sesion', crearSesion);

/**
 * @swagger
 * /api/asistencias/sesion/{sesionId}/qr:
 *   get:
 *     summary: Generar código QR dinámico para una Sesión (Duración 10 mins)
 *     tags: [Asistencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sesionId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: regenerar
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Si es true, ignora el token guardado y genera uno nuevo con bandera de tarde.
 *     responses:
 *       200:
 *         description: Token generado y QR renderizado en Base64
 */
router.get('/sesion/:sesionId/qr', generarQRSesion);

/**
 * @swagger
 * /api/asistencias/sesion/{sesionId}:
 *   get:
 *     summary: Obtener la lista y tabla de asistencias de una sesión específica
 *     tags: [Asistencias]
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
 *         description: Devuelve todos los alumnos que sí verificaron su asistencia
 */
router.get('/sesion/:sesionId', getAsistenciaPorSesion);

/**
 * @swagger
 * /api/asistencias/clase/{claseId}/sesiones:
 *   get:
 *     summary: Obtener todas las sesiones de una clase específica
 *     tags: [Asistencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: claseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Devuelve el listado de sesiones
 */
router.get('/clase/:claseId/sesiones', getSesionesPorClase);

/**
 * @swagger
 * /api/asistencias/sesion/{sesionId}/finalizar:
 *   patch:
 *     summary: Finalizar una sesión de clase
 *     tags: [Asistencias]
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
 *         description: Sesión finalizada correctamente
 *       400:
 *         description: La sesión ya fue finalizada
 *       403:
 *         description: Sin permiso
 *       404:
 *         description: Sesión no encontrada
 */
router.patch('/sesion/:sesionId/finalizar', finalizarSesion);

module.exports = router;
