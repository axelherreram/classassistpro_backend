require('dotenv').config({ path: __dirname + '/../../.env' });
const bcrypt = require('bcryptjs');
const { Catedratico } = require('../models');
const sequelize = require('../config/database');

const seedAdmin = async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexión establecida. Iniciando Seeder...');

        const correoGenerico = 'admin@prueba.com';
        const passwordGenerica = 'admin123';

        // Hashear la contraseña genérica
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(passwordGenerica, salt);

        // Buscar si ya existe para no duplicar datos
        const [catedratico, created] = await Catedratico.findOrCreate({
            where: { correo: correoGenerico },
            defaults: {
                nombre: 'Administrador de Prueba',
                passwordHash: passwordHash,
                rol: 'ADMIN',
                activo: true
            }
        });

        if (created) {
            console.log('\n✅ ¡Administrador genérico creado exitosamente!');
            console.log('--------------------------------------------------');
            console.log(`📧 Correo:     ${correoGenerico}`);
            console.log(`🔑 Contraseña: ${passwordGenerica}`);
            console.log('--------------------------------------------------');
            console.log('NOTA: Utiliza estas credenciales para probar el Login en Swagger.\n');
        } else {
            console.log('\n⚠️  El administrador genérico ya existía previamente en la base de datos.\n');
        }

    } catch (error) {
        console.error('❌ Error al ejecutar el seeder:', error);
    } finally {
        // Cerrar el proceso
        await sequelize.close();
        process.exit(0);
    }
};

seedAdmin();