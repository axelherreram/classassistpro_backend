const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'classassist_super_secret_key_123');
    req.user = verified; // { id, role: 'catedratico'|'estudiante' }
    next();
  } catch (error) {
    res.status(400).json({ error: 'Token inválido o expirado' });
  }
};

const isCatedratico = (req, res, next) => {
  if (req.user && (req.user.role === 'catedratico' || req.user.role === 'CATEDRATICO' || req.user.role === 'ADMIN')) {
    next();
  } else {
    res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de catedrático para esta acción.' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador para esta acción.' });
  }
};

module.exports = { verifyToken, isCatedratico, isAdmin };
