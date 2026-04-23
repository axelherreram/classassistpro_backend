const bcrypt = require('bcryptjs');
const { Catedratico } = require('../models');

// Obtener todos los catedraticos (activos)
const getCatedraticos = async (req, res) => {
  try {
    const catedraticos = await Catedratico.findAll({
      where: { activo: true },
      attributes: { exclude: ['passwordHash'] }
    });
    res.json(catedraticos);
  } catch (error) {
    console.error('Error al obtener catedráticos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear un nuevo catedrático
const createCatedratico = async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;

    if (!nombre || !correo || !password) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
    }

    // Verificar si el correo ya existe
    const existing = await Catedratico.findOne({ where: { correo } });
    if (existing) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const nuevoCatedratico = await Catedratico.create({
      nombre,
      correo,
      passwordHash,
      rol: 'CATEDRATICO',
      activo: true
    });

    res.status(201).json({
      message: 'Catedrático creado exitosamente',
    });
  } catch (error) {
    console.error('Error al crear catedrático:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar un catedrático
const updateCatedratico = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, password } = req.body;

    const catedratico = await Catedratico.findOne({ where: { id, activo: true } });

    if (!catedratico) {
      return res.status(404).json({ error: 'Catedrático no encontrado' });
    }

    // Verificar correo si se está cambiando
    if (correo && correo !== catedratico.correo) {
      const existing = await Catedratico.findOne({ where: { correo } });
      if (existing) {
        return res.status(400).json({ error: 'El correo ya está en uso por otro catedrático' });
      }
      catedratico.correo = correo;
    }

    if (nombre) catedratico.nombre = nombre;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      catedratico.passwordHash = await bcrypt.hash(password, salt);
      catedratico.actualizoContra = true;
    }

    await catedratico.save();

    res.json({
      message: 'Catedrático actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar catedrático:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar un catedrático (Borrado Lógico)
const deleteCatedratico = async (req, res) => {
  try {
    const { id } = req.params;

    const catedratico = await Catedratico.findOne({ where: { id, activo: true } });

    if (!catedratico) {
      return res.status(404).json({ error: 'Catedrático no encontrado' });
    }

    catedratico.activo = false;
    await catedratico.save();

    res.json({ message: 'Catedrático eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar catedrático:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getCatedraticos,
  createCatedratico,
  updateCatedratico,
  deleteCatedratico
};
