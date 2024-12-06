// routes/costos.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Endpoint para obtener evolución de costos
router.get('/evolucionCostos', async (req, res) => {
    try {
        // Registrar la solicitud para debugging
        console.log(`Procesando solicitud de evolución de costos para año: ${req.query.ano || 2023}`);

        // Obtener el año del query parameter, default a 2023 si no se proporciona
        const ano = req.query.ano || 2023;

        // Crear una nueva solicitud usando la conexión existente del pool
        const request = new sql.Request();
        
        // Configurar el parámetro para el stored procedure
        request.input('Ano', sql.Int, ano);
        
        // Ejecutar el stored procedure
        const result = await request.execute('sp_ObtenerEvolucionCostos');
        
        // Verificar si tenemos resultados
        if (result.recordset && result.recordset.length > 0) {
            console.log(`Datos recuperados exitosamente: ${result.recordset.length} registros`);
            res.json({
                success: true,
                data: result.recordset
            });
        } else {
            console.log('No se encontraron datos para el año especificado');
            res.json({
                success: true,
                data: [],
                message: 'No se encontraron datos para el año especificado'
            });
        }
        
    } catch (error) {
        // Logging detallado del error para debugging
        console.error('Error en /evolucionCostos:', {
            message: error.message,
            stack: error.stack,
            originalError: error.originalError
        });

        // Si es un error de token expirado, intentamos reconectar
        if (error.code === 'ELOGIN' && error.originalError?.message.includes('Token is expired')) {
            try {
                // Esperar a que la conexión principal se renueve
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Reintentar la consulta
                const request = new sql.Request();
                request.input('Ano', sql.Int, req.query.ano || 2023);
                const result = await request.execute('sp_ObtenerEvolucionCostos');
                
                return res.json({
                    success: true,
                    data: result.recordset
                });
            } catch (retryError) {
                console.error('Error en el reintento:', retryError);
                return res.status(500).json({
                    success: false,
                    error: 'Error al obtener los datos después del reintento'
                });
            }
        }

        // Enviar respuesta de error al cliente
        res.status(500).json({
            success: false,
            error: 'Error al obtener la evolución de costos',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
        });
    }
});

module.exports = router;