const { Clase, Estudiante, Sesion, Asistencia, ClaseEstudiante } = require('../models');
const { Op } = require('sequelize');

const obtenerMetricas = async (req, res) => {
    try {
        const catedraticoId = req.user.id;
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hoy = `${yyyy}-${mm}-${dd}`;

        // 1. Clases Activas
        const clasesActivasCount = await Clase.count({
            where: { catedraticoId, activo: true }
        });

        // Obtener ids de clases para las demás consultas
        const clases = await Clase.findAll({
            where: { catedraticoId, activo: true },
            attributes: ['id', 'nombre']
        });
        const clasesIds = clases.map(c => c.id);

        if (clasesIds.length === 0) {
            return res.json({
                clasesActivas: 0,
                totalEstudiantes: 0,
                asistenciaPromedio: 0,
                sesionesRestantes: 0,
                clasesHoy: []
            });
        }

        // 2. Total Estudiantes
        const totalEstudiantes = await ClaseEstudiante.count({
            where: { claseId: { [Op.in]: clasesIds } },
            distinct: true,
            col: 'estudianteId'
        });

        // 3. Asistencia Promedio
        // Obtenemos solo sesiones de hoy o pasadas
        const sesionesPasadasRaw = await Sesion.findAll({
            where: { 
                claseId: { [Op.in]: clasesIds },
                fecha: { [Op.lte]: hoy }
            },
            attributes: ['id', 'claseId']
        });

        let asistenciaPromedio = 0;
        if (sesionesPasadasRaw.length > 0) {
            const sesionesPasadasIds = sesionesPasadasRaw.map(s => s.id);
            
            const totalAsistenciasPresente = await Asistencia.count({
                where: { sesionId: { [Op.in]: sesionesPasadasIds }, presente: true }
            });

            const estudiantesPorClase = await ClaseEstudiante.findAll({
                where: { claseId: { [Op.in]: clasesIds } }
            });
            
            const cuentaEstudiantesClase = {};
            estudiantesPorClase.forEach(ce => {
                cuentaEstudiantesClase[ce.claseId] = (cuentaEstudiantesClase[ce.claseId] || 0) + 1;
            });

            let totalAsistenciasPosibles = 0;
            sesionesPasadasRaw.forEach(sesion => {
                totalAsistenciasPosibles += (cuentaEstudiantesClase[sesion.claseId] || 0);
            });

            if (totalAsistenciasPosibles > 0) {
                asistenciaPromedio = Math.round((totalAsistenciasPresente / totalAsistenciasPosibles) * 100);
            }
        }

        // 4. Sesiones Restantes (Sesiones con fecha >= hoy)
        const sesionesRestantes = await Sesion.count({
            where: {
                claseId: { [Op.in]: clasesIds },
                fecha: { [Op.gte]: hoy }
            }
        });

        // 5. Clases de Hoy
        const clasesHoyRaw = await Sesion.findAll({
            where: {
                claseId: { [Op.in]: clasesIds },
                fecha: hoy
            },
            include: [{
                model: Clase,
                attributes: ['nombre']
            }]
        });

        const clasesHoy = clasesHoyRaw.map(s => ({
            id: s.id,
            tema: s.tema,
            nombreClase: s.Clase.nombre,
            fecha: s.fecha
        }));

        res.json({
            clasesActivas: clasesActivasCount,
            totalEstudiantes,
            asistenciaPromedio,
            sesionesRestantes,
            clasesHoy
        });

    } catch (error) {
        console.error('Error al obtener metricas del dashboard:', error);
        res.status(500).json({ error: 'Error al obtener métricas del dashboard' });
    }
};

module.exports = {
    obtenerMetricas
};
