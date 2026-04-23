const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Catedratico } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'classassist_super_secret_key_123';

/**
 * Endpoint de Login (Solo para Catedráticos)
 */
const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ error: 'Correo y password son requeridos' });
    }

    // Buscar el Catedrático
    const user = await Catedratico.findOne({ where: { correo } });
    
    // Si el rol en DB es nulo o no existe, asumimos que es catedrático. Normalizamos a mayúsculas o mantenemos minúsculas para compatibilidad,
    // pero como el ENUM es ADMIN o CATEDRATICO, usaremos el valor de la base de datos.
    const role = user ? (user.rol || 'CATEDRATICO') : 'catedratico';

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ error: 'Este usuario no tiene contraseña registrada' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.passwordHash);    
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Generar Token JWT
    const token = jwt.sign(
      { id: user.id, role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      actualizoContra: user.actualizoContra,
      correo: user.correo,
      nombre: user.nombre
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};

/**
 * Endpoint para actualizar pefil (correo y/o contraseña)
 */
const updateProfile = async (req, res) => {
  try {
    const { nombre, correo, oldPassword, newPassword } = req.body;
    const { id, role } = req.user;

    // Solo catedráticos o ADMIN
    if (role !== 'catedratico' && role !== 'CATEDRATICO' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }

    const user = await Catedratico.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar nombre si se provee
    if (nombre && nombre.trim() !== '') {
      user.nombre = nombre.trim();
    }

    // Si intenta cambiar la contraseña
    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({ error: 'Debes proporcionar tu contraseña actual.' });
      }

      if (user.passwordHash) {
         const validPassword = await bcrypt.compare(oldPassword, user.passwordHash);
         if (!validPassword) {
           return res.status(401).json({ error: 'Contraseña anterior incorrecta' });
         }
      }
      
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      user.actualizoContra = true;
    }

    // Si intenta cambiar el correo
    if (correo && correo !== user.correo) {
      // Verificar que el correo no esté en uso por otro
      const existing = await Catedratico.findOne({ where: { correo } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ error: 'El correo ya está en uso' });
      }
      user.correo = correo;
    }

    await user.save();

    res.json({ 
      message: 'Perfil actualizado con éxito',
      actualizoContra: user.actualizoContra,
      correo: user.correo,
      nombre: user.nombre
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
};

module.exports = {
  login,
  updateProfile
};
