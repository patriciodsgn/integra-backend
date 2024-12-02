const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Constantes para mensajes
const MESSAGES = {
    DB_ERROR: 'Error al consultar la base de datos',
    NO_DATA: 'No se encontraron datos disponibles',
    MISSING_PARAM: 'El parámetro "Rubro" es obligatorio.'
};

// Middleware para validar parámetros opcionales
function validateOptionalParams(req, res, next) {
    const { CodigoDireccion, TipoDireccion } = req.body;

    // Validar tipos de datos opcionales si son enviados
    if (CodigoDireccion && typeof CodigoDireccion !== 'number') {
        return res.status(400).json({
            success: false,
            message: 'El parámetro "CodigoDireccion" debe ser un número.'
        });
    }

    if (TipoDireccion && typeof TipoDireccion !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'El parámetro "TipoDireccion" debe ser un texto.'
        });
    }

    next();
}

// Middleware para validar el parámetro Rubro
function validateRubro(req, res, next) {
    const { Rubro } = req.body;
    if (!Rubro) {
        return res.status(400).json({
            success: false,
            message: MESSAGES.MISSING_PARAM
        });
    }
    next();
}

// Manejo centralizado de errores
function handleError(res, error, statusCode = 500) {
    console.error('Error:', error);
    return res.status(statusCode).json({
        success: false,
        message: MESSAGES.DB_ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
}

// Endpoint para ejecutar sp_ObtenerDirecciones
router.post('/obtenerDirecciones', validateOptionalParams, async (req, res) => {
    try {
        console.log('Recibiendo petición para obtener direcciones:', req.body);
        const { CodigoDireccion, TipoDireccion } = req.body;

        // Ejecutar el procedimiento almacenado
        const result = await sql.request()
            .input('CodigoDireccion', sql.Int, CodigoDireccion || null)
            .input('TipoDireccion', sql.NVarChar(50), TipoDireccion || null)
            .execute('sp_ObtenerDirecciones');

        // Validar si hay resultados
        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        // Responder con los datos
        return res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        });

    } catch (error) {
        return handleError(res, error);
    }
});

// Endpoint para ejecutar sp_ObtenerSubRubros
router.post('/obtenerSubRubros', validateRubro, async (req, res) => {
    try {
        console.log('Recibiendo petición para obtener subrubros:', req.body);
        const { Rubro } = req.body;

        // Ejecutar el procedimiento almacenado
        const result = await sql.request()
            .input('Rubro', sql.NVarChar(30), Rubro)
            .execute('sp_ObtenerSubRubros');

        // Validar si hay resultados
        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        // Responder con los datos
        return res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        });

    } catch (error) {
        return handleError(res, error);
    }
});

// Endpoint para ejecutar sp_ObtenerTodosLosRubros
router.get('/obtenerTodosLosRubros', async (req, res) => {
    try {
        console.log('Recibiendo petición para obtener todos los rubros y subrubros.');

        // Ejecutar el procedimiento almacenado
        const result = await sql.request()
            .execute('sp_ObtenerTodosLosRubros');

        // Validar si hay resultados
        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        // Responder con los datos
        return res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        });

    } catch (error) {
        return handleError(res, error);
    }
});

module.exports = router;
