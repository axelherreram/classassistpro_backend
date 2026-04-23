require('dotenv').config({ path: __dirname + '/../../.env' }); // Asegura la lectura del archivo .env desde la raíz
const bcrypt = require('bcryptjs');
const { Catedratico } = require('../models');
const sequelize = require('../config/database');

const seedCatedratico = async () => {
  try {
    // Autenticar la conexión primero
    await sequelize.authenticate();
    console.log('Conexión establecida. Iniciando Seeder...');

    const correoGenerico = 'catedratico@prueba.com';
    const passwordGenerica = 'admin123';

    // Hashear la contraseña genérica
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordGenerica, salt);

    // Buscar si ya existe para no duplicar datos
    const [catedratico, created] = await Catedratico.findOrCreate({
      where: { correo: correoGenerico },
      defaults: {
        nombre: 'Catedrático de Prueba',
        passwordHash: passwordHash,
        actualizoContra: false
      }
    });

    if (created) {
      console.log('\n✅ ¡Catedrático genérico creado exitosamente!');
      console.log('--------------------------------------------------');
      console.log(`📧 Correo:     ${correoGenerico}`);
      console.log(`🔑 Contraseña: ${passwordGenerica}`);
      console.log('--------------------------------------------------');
      console.log('NOTA: Utiliza estas credenciales para probar el Login en Swagger.\n');
    } else {
      console.log('\n⚠️  El catedrático genérico ya existía previamente en la base de datos.\n');
    }

  } catch (error) {
    console.error('❌ Error al ejecutar el seeder:', error);
  } finally {
    // Cerrar el proceso
    await sequelize.close();
    process.exit(0);
  }
};

seedCatedratico();
