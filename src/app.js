const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Rutas
const authRoutes = require('./routes/authRoutes');
const claseRoutes = require('./routes/claseRoutes');
const estudianteRoutes = require('./routes/estudianteRoutes');
const asistenciaRoutes = require('./routes/asistenciaRoutes'); // Importando módulo de asistencias
const participacionRoutes = require('./routes/participacionRoutes');
const grupoRoutes = require('./routes/grupoRoutes');
const desempenoRoutes = require('./routes/desempenoRoutes'); // Importando módulo de participación (Ruleta)
const dashboardRoutes = require('./routes/dashboardRoutes');
const catedraticoRoutes = require('./routes/catedraticoRoutes');

// Inicializar la app
const app = express();

// Middlewares
app.use(cors()); // Permitir peticiones de otros dominios
app.use(express.json({ limit: '10mb' })); // Parsear el body de las peticiones a JSON con límite ampliado para Base64
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Parsear application/x-www-form-urlencoded

// Servir archivos estáticos
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
// Documentación de Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use('/api/auth', authRoutes);
app.use('/api/clases', claseRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/participaciones', participacionRoutes);
app.use('/api/grupos', grupoRoutes);
app.use('/api/desempeno', desempenoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/catedraticos', catedraticoRoutes);

app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'API CLASSASSIST funcionando correctamente',
    version: '1.0.0'
  });
});

// Middleware para manejo de rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Middleware genérico para manejo de errores (500)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
