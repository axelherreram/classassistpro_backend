const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { Sesion, Asistencia, Estudiante, Clase } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * 1. Generar Código QR Dinámico para una Sesión (Solo Catedráticos)
 */
const generarQRSesion = async (req, res) => {
  try {
    const { sesionId } = req.params;
    const { regenerar } = req.query;
    const catedraticoId = req.user.id;

    // Verificar si la sesión y clase existen, y si pertenece al catedrático
    const sesion = await Sesion.findByPk(sesionId, {
      include: [{ model: Clase }]
    });

    if (!sesion) {
      return res.status(404).json({ error: 'Sesión no encontrada.' });
    }

    if (sesion.Clase.catedraticoId !== catedraticoId) {
      return res.status(403).json({ error: 'No tienes permiso para generar un QR de esta sesión.' });
    }

    const baseUrlFrontend = process.env.FRONTEND_URL ;

    // Si la sesión YA tiene un token guardado y no se solicita regenerar, devolvemos el mismo QR
    if (sesion.qrToken && regenerar !== 'true') {
      const urlFrontendSaved = `${baseUrlFrontend}/registro-asistencia?token=${sesion.qrToken}`;
      const qrImageBase64Saved = await QRCode.toDataURL(urlFrontendSaved);
      return res.json({
        message: 'Esta sesión ya tiene un código QR. Aquí tienes el existente.',
        token: sesion.qrToken,
        qrImage: qrImageBase64Saved,
        venceEn: 'lo que reste de la sesión'
      });
    }

    // El token durará un tiempo extendido para abarcar casi toda la clase
    // El payload contiene el sesionId, y si es regenerado, la bandera tarde será true
    const esTarde = regenerar === 'true';
    const tokenData = { 
      sesionId: sesion.id,
      claseId: sesion.claseId,
      tarde: esTarde
    };

    const token = jwt.sign(tokenData, JWT_SECRET, { expiresIn: '10m' });

    // Guardar el token en la base de datos para no dejar generar más
    sesion.qrToken = token;
    await sesion.save();

    // En un caso real, el QR apuntaría directo a la URL del Frontend pasándole el token por QueryString.
    // Ejemplo: https://frontend.com/marcar-asistencia?token=eyJhbG...
    // Apuntamos a la vista en React donde el alumno pone su carnet y foto.
    const urlFrontend = `${baseUrlFrontend}/registro-asistencia?token=${token}`;    
    const qrImageBase64 = await QRCode.toDataURL(urlFrontend);
    res.json({
      message: 'QR generado con éxito. Válido por 10 minutos.',
      token,
      qrImage: qrImageBase64,
      venceEn: '10 minutos'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar el QR.' });
  }
};

/**
 * 2. Registrar Asistencia escaneando el QR (Estudiantes)
 * Este endpoint es autónomo. El estudiante manda el Token del QR y su Carnet.
 */
const marcarAsistencia = async (req, res) => {
  try {
    const { token, carnet, foto } = req.body;

    if (!token || !carnet || !foto) {
      return res.status(400).json({
        error: 'El token del QR, el Carné y la foto (selfie) son obligatorios.'
      });
    }

    // 1. Validar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        error: 'El código QR ha expirado o es inválido.'
      });
    }

    const { sesionId, claseId, tarde } = decoded;

    // 2. Buscar estudiante
    const estudiante = await Estudiante.findOne({ where: { carnet } });
    if (!estudiante) {
      return res.status(404).json({
        error: 'Estudiante no encontrado en el sistema.'
      });
    }

    // 3. Validar que pertenece a la clase
    const clase = await Clase.findByPk(claseId);
    const perteneceAClase = await clase.hasEstudiante(estudiante);

    if (!perteneceAClase) {
      return res.status(403).json({
        error: 'No estás asignado a esta clase.'
      });
    }

    // 4. Procesar imagen BASE64 correctamente
    let fotoRuta = null;

    console.log('--- DEBUG FOTO ---:', typeof foto, foto ? foto.substring(0, 100) : 'NO_FOTO');

    if (foto && foto.startsWith('data:image')) {
      try {
        const matches = foto.match(/^data:(image\/\w+);base64,(.+)$/);

        if (!matches) {
          return res.status(400).json({
            error: 'Formato de imagen inválido.'
          });
        }

        const mimeType = matches[1]; // image/jpeg
        const extension = mimeType.split('/')[1]; // jpeg / png
        const base64Data = matches[2];

        const imageBuffer = Buffer.from(base64Data, 'base64');

        const fileName = `selfie_${sesionId}_${estudiante.id}_${Date.now()}.${extension}`;

        const uploadDir = path.join(__dirname, '../../public/uploads/selfies');

        // Crear carpeta si no existe
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);

        fs.writeFileSync(filePath, imageBuffer);

        // Ruta que se guarda en BD
        fotoRuta = `uploads/selfies/${fileName}`;

        console.log('✅ Foto guardada en:', fotoRuta);

      } catch (err) {
        return res.status(500).json({
          error: 'Error al procesar la imagen de la selfie.'
        });
      }
    } else {
      return res.status(400).json({
        error: 'La foto no tiene un formato válido (base64 esperado).'
      });
    }

    // 5. Guardar asistencia
    try {
      const nuevaAsistencia = await Asistencia.create({
        presente: true,
        tarde: tarde || false,
        sesionId,
        estudianteId: estudiante.id,
        foto: fotoRuta
      });

      // Emitir el evento de Socket.io en tiempo real a la sala del catedrático
      const io = req.app.get('io');
      if (io) {
        io.to(`sesion_${sesionId}`).emit('nueva-asistencia', {
          id: nuevaAsistencia.id,
          createdAt: nuevaAsistencia.createdAt,
          foto: fotoRuta,
          tarde: nuevaAsistencia.tarde,
          Estudiante: {
            id: estudiante.id,
            nombre: estudiante.nombre,
            carnet: estudiante.carnet
          }
        });
      }

      return res.status(201).json({
        message: 'Asistencia y foto registradas correctamente.',
        asistencia: {
          estudiante: estudiante.nombre,
          carnet: estudiante.carnet,
          fechaHora: nuevaAsistencia.createdAt,
          foto: fotoRuta
        }
      });

    } catch (dbError) {
      if (dbError.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          error: 'Ya has registrado tu asistencia para esta sesión.'
        });
      }

      return res.status(500).json({
        error: 'Error al guardar la asistencia en la base de datos.'
      });
    }

  } catch (error) {
    return res.status(500).json({
      error: 'Error interno del servidor.'
    });
  }
};

/**
 * 3. Obtener listado de asistencia por Sesión (Solo Catedráticos)
 */
const getAsistenciaPorSesion = async (req, res) => {
  try {
    const { sesionId } = req.params;
    const catedraticoId = req.user.id;

    const sesion = await Sesion.findByPk(sesionId, {
      include: [{ model: Clase }]
    });

    if (!sesion || sesion.Clase.catedraticoId !== catedraticoId) {
      return res.status(403).json({ error: 'No tienes permiso o la sesión no existe.' });
    }

    const asistencias = await Asistencia.findAll({
      where: { sesionId },
      include: [{
        model: Estudiante,
        attributes: ['id', 'nombre', 'carnet']
      }],
      attributes: ['id', 'presente', 'tarde', 'createdAt', 'foto'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      sesion: {
        id: sesion.id,
        fecha: sesion.fecha,
        tema: sesion.tema
      },
      totalAsistentes: asistencias.length,
      asistencias
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las asistencias.' });
  }
};

/**
 * 4. (EXTRA) Endpoint rápido para crear una Sesión (Para que puedas probar)
 */
const crearSesion = async (req, res) => {
  try {
    const { claseId, fecha, tema } = req.body;
    const catedraticoId = req.user.id;

    const clase = await Clase.findOne({ where: { id: claseId, catedraticoId } });
    if (!clase) {
      return res.status(403).json({ error: 'No autorizado o clase inexistente.' });
    }

    const sesion = await Sesion.create({
      fecha: fecha || new Date().toISOString().split('T')[0],
      tema,
      claseId
    });

    res.status(201).json({ message: 'Sesión iniciada', sesion });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la sesión' });
  }
};

/**
 * 5. Obtener todas las sesiones de una clase específica
 */
const getSesionesPorClase = async (req, res) => {
  try {
    const { claseId } = req.params;
    const catedraticoId = req.user.id;

    const clase = await Clase.findOne({ where: { id: claseId, catedraticoId } });
    if (!clase) {
      return res.status(403).json({ error: 'No autorizado o clase inexistente.' });
    }

    const sesiones = await Sesion.findAll({
      where: { claseId },
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({ sesiones });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las sesiones.' });
  }
};

module.exports = {
  generarQRSesion,
  marcarAsistencia,
  getAsistenciaPorSesion,
  crearSesion,
  getSesionesPorClase
};
