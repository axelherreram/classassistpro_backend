require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');

// Importamos el index de los modelos para asegurarnos de que Sequelize registre todos y sus asociaciones
require('./models');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Sincroniza los modelos con la base de datos (alter: true para aplicar cambios en estructura, como borrar passwordHash)
    await sequelize.sync({ force: false, alter: true });
    console.log('Modelos sincronizados con la base de datos correctamente.');

    // Iniciar el servidor Express con Socket.io
    const server = require('http').createServer(app);
    const { Server } = require('socket.io');
    
    const io = new Server(server, {
      cors: {
        origin: "*", // Permite conexiones desde el frontend
        methods: ["GET", "POST"]
      }
    });

    // Guardar la instancia de io en app para usarla en los controladores
    app.set('io', io);

    io.on('connection', (socket) => {
      console.log('Nuevo cliente conectado a Socket.io:', socket.id);
      
      // El catedrático se une a una sala específica de su sesión
      socket.on('join-sesion', (sesionId) => {
        socket.join(`sesion_${sesionId}`);
        console.log(`Socket ${socket.id} se unió a la sala en vivo de la sesión: sesion_${sesionId}`);
      });

      socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
      });
    });

    server.listen(PORT, () => {
      console.log(`Servidor de CLASSASSIST con WebSockets corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor o conectar a la base de datos:', error);
    process.exit(1);
  }
};

startServer();
