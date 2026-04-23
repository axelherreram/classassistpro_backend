const { Clase } = require('../models');

// Crear una nueva clase
const createClase = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const catedraticoId = req.user.id; // Obtenido del token jwt

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre de la clase es obligatorio' });
    }

    const nuevaClase = await Clase.create({
      nombre,
      descripcion,
      catedraticoId,
      activo: true
    });

    res.status(201).json({ message: 'Clase creada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la clase' });
  }
};

// Obtener todas las clases del catedrático autenticado (Solo las activas)
const getClases = async (req, res) => {
  try {
    const catedraticoId = req.user.id;

    const clases = await Clase.findAll({
      where: {
        catedraticoId,
        activo: true 
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({ clases });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las clases' });
  }
};

// Obtener una clase por ID
const getClaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const catedraticoId = req.user.id;

    const clase = await Clase.findOne({
      where: {
        id,
        catedraticoId, // Aseguramos que pertenezca al catedrático actual
        activo: true
      }
    });

    if (!clase) {
      return res.status(404).json({ error: 'Clase no encontrada o no tienes permisos' });
    }

    res.json({ clase });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la clase' });
  }
};

// Actualizar una clase
const updateClase = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    const catedraticoId = req.user.id;

    const clase = await Clase.findOne({ where: { id, catedraticoId, activo: true } });

    if (!clase) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    await clase.update({
      nombre: nombre || clase.nombre,
      descripcion: descripcion !== undefined ? descripcion : clase.descripcion
    });

    res.json({ message: 'Clase actualizada con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la clase' });
  }
};

// Borrado lógico de una clase
const deleteClase = async (req, res) => {
  try {
    const { id } = req.params;
    const catedraticoId = req.user.id;

    const clase = await Clase.findOne({ where: { id, catedraticoId, activo: true } });

    if (!clase) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    // Borrado logico
    await clase.update({ activo: false });

    res.json({ message: 'Clase eliminada con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la clase' });
  }
};

module.exports = {
  createClase,
  getClases,
  getClaseById,
  updateClase,
  deleteClase
};
