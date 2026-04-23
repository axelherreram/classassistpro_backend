const { Estudiante, Clase } = require('../models');
const ExcelJS = require('exceljs');

// Utilidad para asegurar que la clase le pertenece al catedrático
const checkClaseOwnership = async (claseId, catedraticoId) => {
  const clase = await Clase.findOne({ where: { id: claseId, catedraticoId, activo: true } });
  return clase;
};

/**
 * 1. Ingreso individual de un Estudiante
 */
const createEstudiante = async (req, res) => {
  try {
    const { claseId } = req.params;
    const { nombre, carnet, correo } = req.body;
    const catedraticoId = req.user.id;

    // Validar si la clase pertenece al catedrático actual
    const clase = await checkClaseOwnership(claseId, catedraticoId);
    if (!clase) {
      return res.status(403).json({ error: 'No tienes permiso para agregar estudiantes a esta clase o no existe.' });
    }

    if (!nombre || !carnet) {
      return res.status(400).json({ error: 'El nombre y Carné son obligatorios.' });
    }

    // Verificar si el estudiante (matrícula) ya existe a nivel global
    let estudiante = await Estudiante.findOne({ where: { carnet } });
    
    if (estudiante) {
      // Si existe, validamos si ya está en ESTA clase puntualmente
      const yaInscrito = await clase.hasEstudiante(estudiante);
      if (yaInscrito) {
        return res.status(400).json({ error: `El estudiante con matrícula ${carnet} ya está inscrito en esta clase.` });
      }
    } else {
      // Si no existe lo creamos
      estudiante = await Estudiante.create({
        nombre,
        carnet,
        correo
      });
    }

    // Finalmente lo vinculamos a la clase
    await clase.addEstudiante(estudiante);

    res.status(201).json({ message: 'Estudiante agregado correctamente a la clase', estudiante });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agregar al estudiante' });
  }
};

/**
 * 2. Carga MASIVA de estudiantes desde Excel
 */
const uploadEstudiantesExcel = async (req, res) => {
  try {
    const { claseId } = req.params;
    const catedraticoId = req.user.id;

    // 1. Validar propiedad de la clase
    const clase = await checkClaseOwnership(claseId, catedraticoId);
    if (!clase) {
      return res.status(403).json({ error: 'No tienes permiso sobre esta clase.' });
    }

    // 2. Verificar que haya un archivo
    if (!req.file) {
      return res.status(400).json({ error: 'Por favor, sube un archivo excel (.xlsx)' });
    }

    // 3. Leer el archivo Excel en memoria usando ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0]; // Tomar la primera hoja

    if (!worksheet) {
      return res.status(400).json({ error: 'El archivo Excel no tiene hojas válidas.' });
    }

    const rows = [];
    const headers = {};

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) {
        // Leer encabezados
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          headers[colNumber] = cell.value ? String(cell.value).trim() : `Columna${colNumber}`;
        });
      } else {
        // Leer filas de datos
        const rowData = {};
        Object.keys(headers).forEach(colNum => {
          const key = headers[colNum];
          const cell = row.getCell(Number(colNum));
          let val = cell.value;
          
          if (val && typeof val === 'object') {
             if (val.richText) val = val.richText.map(rt => rt.text).join('');
             else if (val.result !== undefined) val = val.result;
          }
          rowData[key] = val !== null && val !== undefined ? String(val) : "";
        });
        rows.push(rowData);
      }
    });

    if (rows.length === 0) {
      return res.status(400).json({ error: 'El archivo Excel está vacío.' });
    }

    const estudiantesARegistrar = [];
    const erroresValidacion = [];

    // Iterar cada fila
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Reconocer dinámicamente las columnas (Ignoramos espacios en blanco extra)
        const getColValue = (keyMatch) => {
            const foundKey = Object.keys(row).find(k => k.toLowerCase().includes(keyMatch.toLowerCase()));
            return foundKey ? String(row[foundKey]).trim() : '';
        };

        const carnet = getColValue('Carné') || getColValue('Carne') || getColValue('carnet');
        const nombre = getColValue('Estudiante') || getColValue('Nombre');
        const correo = getColValue('Correo') || getColValue('Email');

        // Validaciones por fila
        if (!carnet || !nombre) {
            erroresValidacion.push(`Fila ${i + 2}: Faltan datos obligatorios (Carné o Nombre).`);
            continue;
        }

        // Validar si ya existe en este array (concurrencia en Excel)
        const yaExisteEnArray = estudiantesARegistrar.find(e => e.carnet === carnet);
        if (yaExisteEnArray) {
            erroresValidacion.push(`Fila ${i + 2}: Matrícula duplicada en el propio archivo (${carnet}).`);
            continue;
        }

        estudiantesARegistrar.push({
            nombre: nombre,
            carnet: carnet,
            correo: correo
        });
    }

    let insertadosOAsignados = 0;

    // Procesar los registros verificando si existen en la BD global
    for (const estData of estudiantesARegistrar) {
        let estudiante = await Estudiante.findOne({ where: { carnet: estData.carnet } });
        
        if (!estudiante) {
             // Crear nuevo si no existe globalmente
             estudiante = await Estudiante.create(estData);
        }

        // Validar si ya está inscrito en la clase
        const yaInscrito = await clase.hasEstudiante(estudiante);
        
        if (!yaInscrito) {
             await clase.addEstudiante(estudiante);
             insertadosOAsignados++;
        } else {
             erroresValidacion.push(`El estudiante ${estData.carnet} ya estaba inscrito en esta clase y fue ignorado.`);
        }
    }

    res.status(200).json({
      message: 'Procesamiento de Excel finalizado',
      resumen: {
        totalLeidos: rows.length,
        asignadosConExito: insertadosOAsignados,
        erroresOIgnorados: erroresValidacion.length
      },
      detallesDeError: erroresValidacion
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar el archivo Excel.' });
  }
};

/**
 * 3. Obtener la tabla de estudiantes de una Clase
 */
const getEstudiantesByClase = async (req, res) => {
  try {
    const { claseId } = req.params;
    const catedraticoId = req.user.id;

    // Verificar propiedad
    const clase = await checkClaseOwnership(claseId, catedraticoId);
    if (!clase) {
      return res.status(403).json({ error: 'No tienes permiso sobre esta clase.' });
    }

    const estudiantes = await clase.getEstudiantes({
      order: [['nombre', 'ASC']],
      joinTableAttributes: [] // Oculta los datos de la tabla intermedia que no nos interesan
    });

    const data = estudiantes.map(est => ({
        id: est.id,
        nombre: est.nombre,
        carnet: est.carnet,
        correo: est.correo
    }));

    res.json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la lista de estudiantes' });
  }
};

/**
 * 4. Remover a un Estudiante de la clase (Descarnetr)
 */
const removeEstudianteDeClase = async (req, res) => {
    try {
        const { claseId, estId } = req.params;
        const catedraticoId = req.user.id;
        
        // Validar dueño de la clase
        const clase = await checkClaseOwnership(claseId, catedraticoId);
        if (!clase) {
            return res.status(403).json({ error: 'No tienes permiso o la clase no existe.' });
        }

        const estudiante = await Estudiante.findByPk(estId);
        if (!estudiante) {
            return res.status(404).json({ error: 'Estudiante no encontrado.' });
        }

        // Remover solo la asociación, no borrar al estudiante de la base de datos (Porque puede estar en otras clases)
        const removed = await clase.removeEstudiante(estudiante);

        if (!removed) {
            return res.status(400).json({ error: 'El estudiante no pertenece a esta clase.' });
        }

        res.json({ message: 'Estudiante removido de la clase correctamente.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al remover al estudiante de la clase.' });
    }
}

module.exports = {
  createEstudiante,
  uploadEstudiantesExcel,
  getEstudiantesByClase,
  removeEstudianteDeClase
};
