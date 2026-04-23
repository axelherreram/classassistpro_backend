const express = require('express');
const router = express.Router();
const { obtenerRanking } = require('../controllers/desempenoController');       
const { verifyToken, isCatedratico } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.use(isCatedratico);

/**
 * @swagger
 * tags:
 *   name: Desempeño
 *   description: Cálculo y visualización del desempeño académico de los estudiantes
 */

/**
 * @swagger
 * /api/desempeno/clase/{claseId}/ranking:
 *   get:
 *     summary: Obtener el ranking de desempeño global de una clase
 *     description: Calcula los puntos en base a la fórmula de Asistencias (x10) + Participaciones de todas las sesiones de la clase.
 *     tags: [Desempeño]
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
 *         description: Ranking general devuelto exitosamente
 *       404:
 *         description: Clase no encontrada o sin permisos
 */
router.get('/clase/:claseId/ranking', obtenerRanking);

/**
 * @swagger
 * /api/desempeno/sesion/{sesionId}/ranking:
 *   get:
 *     summary: Obtener el ranking de desempeño focalizado sólo en una sesión
 *     description: Calcula los puntos en base a la fórmula de Asistencias (x10) + Participaciones ganados estrictamente en esa sesión.
 *     tags: [Desempeño]
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
 *         description: Ranking de la sesión devuelto exitosamente
 *       404:
 *         description: Sesión o clase no encontrada
 */
router.get('/sesion/:sesionId/ranking', obtenerRanking);

module.exports = router;
