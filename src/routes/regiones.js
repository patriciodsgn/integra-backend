const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Constantes para mensajes
const MESSAGES = {
    DB_ERROR: 'Error al consultar la base de datos',
    NO_DATA: 'No se encontraron regiones'
};

// Manejo de errores centralizado
function handleError(res, error, statusCode = 500) {
    console.error('Error detallado:', error);
    return res.status(statusCode).json({
        success: false,
        message: MESSAGES.DB_ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
}

router.get('/tbRegion', async (req, res) => {
    try {
        // Usar la conexión existente
        const result = await sql.query`EXEC sp_ObtenerRegiones`;

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