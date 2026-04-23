const express = require('express');
const { createClase, getClases, getClaseById, updateClase, deleteClase } = require('../controllers/clasesController');
const { verifyToken, isCatedratico } = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas las rutas de clases requieren estar autenticado y ser catedrático
router.use(verifyToken, isCatedratico);

/**
 * @swagger
 * tags:
 *   name: Clases
 *   description: Operaciones CRUD para Clases (Exclusivo Catedráticos)
 */

/**
 * @swagger
 * /api/clases:
 *   post:
 *     summary: Crear una nueva clase
 *     tags: [Clases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Clase creada
 *       403:
 *         description: Acceso denegado, debe ser catedrático
 */
router.post('/', createClase);

/**
 * @swagger
 * /api/clases:
 *   get:
 *     summary: Obtener todas mis clases (Solo clases activas)
 *     tags: [Clases]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clases devuelta con éxito
 */
router.get('/', getClases);

/**
 * @swagger
 * /api/clases/{id}:
 *   get:
 *     summary: Obtener una clase específica por ID
 *     tags: [Clases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la clase
 *     responses:
 *       200:
 *         description: Clase encontrada
 *       404:
 *         description: Clase no encontrada
 */
router.get('/:id', getClaseById);

/**
 * @swagger
 * /api/clases/{id}:
 *   put:
 *     summary: Actualizar información de una clase (nombre y descripción)
 *     tags: [Clases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la clase a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Clase actualizada correctamente
 *       404:
 *         description: Clase no encontrada
 */
router.put('/:id', updateClase);

/**
 * @swagger
 * /api/clases/{id}:
 *   delete:
 *     summary: Eliminar una clase (Borrado Lógico)
 *     tags: [Clases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la clase a eliminar lógicamente
 *     responses:
 *       200:
 *         description: Clase eliminada (borrado lógico) exitosamente
 *       404:
 *         description: Clase no encontrada
 */
router.delete('/:id', deleteClase);

module.exports = router;
