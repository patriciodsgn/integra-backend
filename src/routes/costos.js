// routes/costos.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Endpoint para obtener evolución de costos
router.get('/evolucionCostos', async (req, res) => {
    try {
        // Registrar la solicitud para debugging
        console.log('🔄 Procesando solicitud de evolución de costos');
        console.log('Query params:', req.query);

        // Crear una nueva solicitud usando la conexión existente del pool
        const request = new sql.Request();
        
        // Si se proporciona un año, lo pasamos al SP, si no, el SP usará el más reciente
        if (req.query.ano) {
            request.input('Ano', sql.Int, parseInt(req.query.ano));
            console.log(`📅 Año solicitado: ${req.query.ano}`);
        } else {
            console.log('📅 No se especificó año, SP usará el más reciente');
        }
        
        // Ejecutar el stored procedure
        const result = await request.execute('sp_ObtenerEvolucionCostos');
        
        // Verificar si tenemos resultados
        if (result.recordset && result.recordset.length > 0) {
            const years = [...new Set(result.recordset.map(r => r.Ano))];
            console.log(`✅ Datos recuperados exitosamente:`, {
                totalRegistros: result.recordset.length,
                años: years,
                primerRegistro: result.recordset[0]
            });

            res.json({
                success: true,
                data: result.recordset,
                years: years
            });
        } else {
            console.log('⚠️ No se encontraron datos');
            res.json({
                success: true,
                data: [],
                message: 'No se encontraron datos para los años solicitados'
            });
        }
        
    } catch (error) {
        // Logging detallado del error para debugging
        console.error('❌ Error en /evolucionCostos:', {
            message: error.message,
            stack: error.stack,
            originalError: error.originalError
        });

        // Si es un error de token expirado, intentamos reconectar
        if (error.code === 'ELOGIN' && error.originalError?.message.includes('Token is expired')) {
            try {
                console.log('🔄 Reintentando conexión después de error de token...');
                // Esperar a que la conexión principal se renueve
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Reintentar la consulta
                const request = new sql.Request();
                if (req.query.ano) {
                    request.input('Ano', sql.Int, parseInt(req.query.ano));
                }
                const result = await request.execute('sp_ObtenerEvolucionCostos');
                
                console.log('✅ Reintento exitoso');
                return res.json({
                    success: true,
                    data: result.recordset,
                    years: [...new Set(result.recordset.map(r => r.Ano))]
                });
            } catch (retryError) {
                console.error('❌ Error en el reintento:', retryError);
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
// Endpoint para obtener el comparativo CMM Regional
router.get('/comparativoCMM', async (req, res) => {
    try {
        // Registrar la solicitud para debugging
        console.log('Procesando solicitud para obtener comparativo CMM Regional');

        // Crear una nueva solicitud usando la conexión existente del pool
        const request = new sql.Request();

        // Ejecutar el stored procedure
        const result = await request.execute('sp_ComparativoCMMRegional');

        // Verificar si tenemos resultados
        if (result.recordset && result.recordset.length > 0) {
            console.log(`Datos recuperados exitosamente: ${result.recordset.length} registros`);
            res.json({
                success: true,
                data: result.recordset
            });
        } else {
            console.log('No se encontraron datos');
            res.json({
                success: true,
                data: [],
                message: 'No se encontraron datos'
            });
        }

    } catch (error) {
        // Logging detallado del error para debugging
        console.error('Error en /comparativoCMM:', {
            message: error.message,
            stack: error.stack,
            originalError: error.originalError
        });

        // Enviar respuesta de error al cliente
        res.status(500).json({
            success: false,
            error: 'Error al obtener el comparativo CMM',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
        });
    }
});
module.exports = router;