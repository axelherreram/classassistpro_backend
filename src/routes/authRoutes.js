const express = require('express');
const { login, updateProfile } = require('../controllers/authController');     
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de de autenticación y seguridad
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - password
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login exitoso y devuelve Token JWT
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: Credenciales incorrectas
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Actualizar perfil del Catedrático (correo y/o contraseña)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *               oldPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente
 *       400:
 *         description: Error en datos o correo en uso
 *       401:
 *         description: Contraseña actual incorrecta o token no proporcionado   
 */
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
