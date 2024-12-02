const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Constantes para mensajes
const MESSAGES = {
    DB_ERROR: 'Error al consultar la base de datos',
    NO_DATA: 'Usuario no encontrado',
    INVALID_RUT: 'Clave incorrecta',
    MISSING_PARAM: 'Los parámetros "CorreoElectronico" y "RUT" son obligatorios.'
};

// Middleware para validar parámetros
function validateLoginParams(req, res, next) {
    const { CorreoElectronico, RUT } = req.body;

    if (!CorreoElectronico || !RUT) {
        return res.status(400).json({
            success: false,
            message: MESSAGES.MISSING_PARAM
        });
    }

    if (typeof CorreoElectronico !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'El parámetro "CorreoElectronico" debe ser un texto.'
        });
    }

    if (typeof RUT !== 'number') {
        return res.status(400).json({
            success: false,
            message: 'El parámetro "RUT" debe ser un número.'
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

// Endpoint para ejecutar sp_ObtenerDatosUsuario
router.post('/', validateLoginParams, async (req, res) => {
    try {
        console.log('Recibiendo petición de login:', req.body);
        const { CorreoElectronico, RUT } = req.body;

        // Crear una nueva instancia de Request
        const pool = await sql.connect(); // Asegúrate de que la conexión esté establecida
        const request = pool.request();

        // Ejecutar el procedimiento almacenado
        const result = await request
            .input('CorreoElectronico', sql.NVarChar(100), CorreoElectronico)
            .input('RUT', sql.BigInt, RUT)
            .execute('sp_ObtenerDatosUsuario');

        // Validar si hay resultados
        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        // Comprobar el mensaje devuelto en el resultado
        const mensaje = result.recordset[0].Mensaje;
        if (mensaje) {
            if (mensaje === 'Clave incorrecta') {
                return res.status(401).json({
                    success: false,
                    message: MESSAGES.INVALID_RUT
                });
            } else if (mensaje === 'Usuario no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: MESSAGES.NO_DATA
                });
            }
        }

        // Responder con los datos del usuario
        return res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        return handleError(res, error);
    }
});

module.exports = router;
