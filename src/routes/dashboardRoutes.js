const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, isCatedratico } = require('../middlewares/authMiddleware');

router.get('/metricas', verifyToken, isCatedratico, dashboardController.obtenerMetricas);

module.exports = router;
