const express = require('express');
const multer = require('multer');
const { 
  createEstudiante, 
  uploadEstudiantesExcel, 
  getEstudiantesByClase,
  removeEstudianteDeClase 
} = require('../controllers/estudiantesController');
const { verifyToken, isCatedratico } = require('../middlewares/authMiddleware');

const router = express.Router();

// Configuración de multer (memoria para procesarlo directamente)
const upload = multer({ storage: multer.memoryStorage() });

// Proteger todas las rutas, solo Catedráticos
router.use(verifyToken, isCatedratico);

/**
 * @swagger
 * tags:
 *   name: Gestion-Estudiantes
 *   description: Administración de estudiantes asociados a una clase
 */

/**
 * @swagger
 * /api/estudiantes/clase/{claseId}:
 *   get:
 *     summary: Obtener la tabla de estudiantes inscritos en una clase
 *     tags: [Gestion-Estudiantes]
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
 *         description: Lista de estudiantes obtenida
 */
router.get('/clase/:claseId', getEstudiantesByClase);

/**
 * @swagger
 * /api/estudiantes/clase/{claseId}:
 *   post:
 *     summary: Ingreso individual de un estudiante a una clase
 *     tags: [Gestion-Estudiantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: claseId
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
 *               - nombre
 *               - carnet
 *             properties:
 *               nombre:
 *                 type: string
 *               carnet:
 *                 type: string
 *                 description: Carné del estudiante
 *               correo:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Estudiante insertado
 */
router.post('/clase/:claseId', createEstudiante);

/**
 * @swagger
 * /api/estudiantes/clase/{claseId}/excel:
 *   post:
 *     summary: Carga masiva de estudiantes mediante un archivo Excel (.xlsx)
 *     tags: [Gestion-Estudiantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: claseId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               archivo:
 *                 type: string
 *                 format: binary
 *                 description: Excel con columnas (No. | Carné | Estudiante | Correo Electrónico)
 *     responses:
 *       200:
 *         description: Resumen de carga masiva procesada
 */
router.post('/clase/:claseId/excel', upload.single('archivo'), uploadEstudiantesExcel);

/**
 * @swagger
 * /api/estudiantes/clase/{claseId}/estudiante/{estId}:
 *   delete:
 *     summary: Remover un estudiante de una clase (Descarnetr)
 *     tags: [Gestion-Estudiantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: claseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la clase
 *       - in: path
 *         name: estId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del estudiante
 *     responses:
 *       200:
 *         description: Estudiante removido de la clase
 */
router.delete('/clase/:claseId/estudiante/:estId', removeEstudianteDeClase);

module.exports = router;
