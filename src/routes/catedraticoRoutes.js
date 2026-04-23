const express = require('express');
const router = express.Router();
const catedraticoController = require('../controllers/catedraticoController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Proteger todas las rutas con verifyToken y isAdmin
router.use(verifyToken, isAdmin);

/**
 * @swagger
 * tags:
 *   name: Catedraticos
 *   description: Gestión de catedráticos (Solo Administradores)
 */

/**
 * @swagger
 * /api/catedraticos:
 *   get:
 *     summary: Obtener todos los catedráticos activos
 *     tags: [Catedraticos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de catedráticos obtenida con éxito
 *       403:
 *         description: Acceso denegado, debe ser administrador
 */
router.get('/', catedraticoController.getCatedraticos);

/**
 * @swagger
 * /api/catedraticos:
 *   post:
 *     summary: Crear un nuevo catedrático
 *     tags: [Catedraticos]
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
 *               - correo
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *               correo:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Catedrático creado
 *       400:
 *         description: El correo ya está registrado o faltan datos
 *       403:
 *         description: Acceso denegado, debe ser administrador
 */
router.post('/', catedraticoController.createCatedratico);

/**
 * @swagger
 * /api/catedraticos/{id}:
 *   put:
 *     summary: Actualizar la información de un catedrático
 *     tags: [Catedraticos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del catedrático a actualizar
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               correo:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Catedrático actualizado exitosamente
 *       400:
 *         description: El correo ya está en uso por otro catedrático
 *       404:
 *         description: Catedrático no encontrado
 *       403:
 *         description: Acceso denegado, debe ser administrador
 */
router.put('/:id', catedraticoController.updateCatedratico);

/**
 * @swagger
 * /api/catedraticos/{id}:
 *   delete:
 *     summary: Eliminar un catedrático (Borrado Lógico)
 *     tags: [Catedraticos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del catedrático a eliminar lógicamente
 *     responses:
 *       200:
 *         description: Catedrático eliminado exitosamente
 *       404:
 *         description: Catedrático no encontrado
 *       403:
 *         description: Acceso denegado, debe ser administrador
 */
router.delete('/:id', catedraticoController.deleteCatedratico);

module.exports = router;
