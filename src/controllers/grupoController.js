const { Grupo, GrupoEstudiante, Sesion, Clase, Asistencia, Estudiante, Participacion } = require('../models');

// Función para barajar array
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const generarGrupos = async (req, res) => {
    try {
        const { sesionId } = req.params;
        let { tipo, cantidad } = req.body; 
        const catedraticoId = req.user.id;

        // Validar sesión
        const sesion = await Sesion.findByPk(sesionId, { include: Clase });
        if (!sesion || sesion.Clase.catedraticoId !== catedraticoId) {
            return res.status(403).json({ error: 'Sesión no válida o sin permisos.' });
        }
        if (sesion.estado === 'finalizada') {
            return res.status(400).json({ error: 'No se pueden generar grupos porque la sesión ya está finalizada.' });
        }

        if (!tipo || !cantidad || cantidad <= 0) {
            return res.status(400).json({ error: 'Debes definir el tipo y una cantidad válida.' });
        }

        // Estudiantes presentes
        const asistencias = await Asistencia.findAll({
            where: { sesionId, presente: true },
            include: [{ model: Estudiante }]
        });

        if (asistencias.length === 0) {
            return res.status(400).json({ error: 'No hay estudiantes presentes para formar grupos.' });
        }

        let estudiantes = asistencias.map(a => a.Estudiante);
        estudiantes = shuffleArray(estudiantes);
        
        let numGroups = 1;
        if (tipo === 'grupos') {
            numGroups = Math.min(cantidad, estudiantes.length);
        } else if (tipo === 'estudiantes') {
            numGroups = Math.ceil(estudiantes.length / cantidad);
        }

         // Verificar si ya existen grupos para esta sesión
        const gruposExistentes = await Grupo.findAll({ where: { sesionId } });
        if (gruposExistentes.length > 0) {
            return res.status(400).json({ error: 'Ya se han generado grupos para esta sesión. Solo se permite generar una vez.' });
        }

        
        // Obtener historial de grupos de sesiones anteriores de la misma clase
        const sesionesAnteriores = await Sesion.findAll({
            where: { claseId: sesion.claseId },
            attributes: ['id']
        });
        const sesionesIds = sesionesAnteriores.map(s => s.id).filter(id => id !== Number(sesionId));

        const gruposAnteriores = await Grupo.findAll({
            where: { sesionId: sesionesIds },
            include: [{ model: Estudiante, through: { attributes: [] } }]
        });

        // Mapa de afinidad: { idEstudianteA: { idEstudianteB: vecesJuntos } }
        const historial = {};
        estudiantes.forEach(e => {
            historial[e.id] = {};
            estudiantes.forEach(e2 => {
                if (e.id !== e2.id) historial[e.id][e2.id] = 0;
            });
        });

        gruposAnteriores.forEach(grupo => {
            const integrantes = grupo.Estudiantes || [];
            for (let i = 0; i < integrantes.length; i++) {
                for (let j = i + 1; j < integrantes.length; j++) {
                    const id1 = integrantes[i].id;
                    const id2 = integrantes[j].id;
                    if (historial[id1] && historial[id1][id2] !== undefined) {
                        historial[id1][id2]++;
                    }
                    if (historial[id2] && historial[id2][id1] !== undefined) {
                        historial[id2][id1]++;
                    }
                }
            }
        });

        // Repartir estudiantes con algoritmo para minimizar repeticiones
        const distribution = Array.from({ length: numGroups }, () => []);
        const maxSize = Math.ceil(estudiantes.length / numGroups);

        estudiantes.forEach((est) => {
            let bestGroup = -1;
            let minPenalty = Infinity;

            const groupIndices = shuffleArray(Array.from({length: numGroups}, (_, i) => i));

            for (const i of groupIndices) {
                if (distribution[i].length >= maxSize) continue;

                let penalty = 0;
                for (const member of distribution[i]) {
                    penalty += (historial[est.id]?.[member.id] || 0);
                }

                // Penalty weight + slightly favor smaller groups to keep distribution even
                const totalScore = penalty * 1000 + distribution[i].length;

                if (totalScore < minPenalty) {
                    minPenalty = totalScore;
                    bestGroup = i;
                }
            }

            if (bestGroup !== -1) {
                distribution[bestGroup].push(est);
            } else {
                distribution.sort((a,b) => a.length - b.length)[0].push(est);
            }
        });

        const createdGroups = [];

        for (let i = 0; i < distribution.length; i++) {
            if (distribution[i].length > 0) {
                const grupo = await Grupo.create({
                    nombre: `Grupo ${i + 1}`,
                    sesionId
                });

                const groupStudents = distribution[i].map(est => ({
                    grupoId: grupo.id,
                    estudianteId: est.id
                }));

                await GrupoEstudiante.bulkCreate(groupStudents);

                createdGroups.push({
                    ...grupo.toJSON(),
                    Estudiantes: distribution[i]
                });
            }
        }

        res.json({
            mensaje: 'Grupos generados exitosamente.',
            grupos: createdGroups
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar los grupos.' });
    }
};

const obtenerGrupos = async (req, res) => {
    try {
        const { sesionId } = req.params;
        const catedraticoId = req.user.id;

        const sesion = await Sesion.findByPk(sesionId, { include: Clase });
        if (!sesion || sesion.Clase.catedraticoId !== catedraticoId) {
            return res.status(403).json({ error: 'Sesión no válida o sin permisos.' });
        }

        const grupos = await Grupo.findAll({
            where: { sesionId },
            include: [{
                model: Estudiante,
                attributes: ['id', 'nombre', 'carnet'],
                through: { attributes: [] }
            }]
        });

        res.json({ grupos });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los grupos.' });
    }
};

const calificarGrupo = async (req, res) => {
    try {
        const { grupoId } = req.params;
        const { puntos, descripcion } = req.body;
        const catedraticoId = req.user.id;

        if (puntos == null) {
            return res.status(400).json({ error: 'Se requieren puntos.' });
        }

        const grupo = await Grupo.findByPk(grupoId, {
            include: [
                { model: Sesion, include: [Clase] },
                { model: Estudiante, through: { attributes: [] } }
            ]
        });

        if (!grupo || !grupo.Sesion || grupo.Sesion.Clase.catedraticoId !== catedraticoId) {
            return res.status(403).json({ error: 'Grupo no válido o sin permisos.' });
        }

        const participaciones = grupo.Estudiantes.map(est => ({
            descripcion: descripcion || `Calificación del ${grupo.nombre}`,
            puntos,
            estudianteId: est.id,
            sesionId: grupo.sesionId
        }));

        await Participacion.bulkCreate(participaciones);

        res.json({ mensaje: `Calificación aplicada a ${participaciones.length} estudiantes del ${grupo.nombre}.` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al calificar el grupo.' });
    }
};

module.exports = {
    generarGrupos,
    obtenerGrupos,
    calificarGrupo
};
