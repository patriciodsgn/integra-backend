const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Mensajes de error
const MESSAGES = {
    DB_ERROR: 'Error al consultar la base de datos',
    NO_DATA: 'No se encontraron datos para los parámetros especificados',
    INVALID_PARAMS: 'Los parámetros proporcionados no son válidos'
};

// Middleware para validar parámetros
function validateParams(req, res, next) {
    const { CodigoRegion, Mes, Ano } = req.query;

    if ((CodigoRegion && isNaN(parseInt(CodigoRegion))) ||
        (Mes && isNaN(parseInt(Mes))) ||
        (Ano && isNaN(parseInt(Ano)))) {
        return res.status(400).json({
            success: false,
            message: MESSAGES.INVALID_PARAMS
        });
    }

    next();
}

// Endpoint para obtener indicadores de la región
router.get('/indicadoresRegion', validateParams, async (req, res) => {
    try {
        const { CodigoRegion, Mes, Ano } = req.query;

        // Crear un objeto de solicitud SQL
        const request = new sql.Request();

        // Asignar parámetros opcionales
        request.input('CodigoRegion', sql.Int, CodigoRegion ? parseInt(CodigoRegion) : null);
        request.input('Mes', sql.Int, Mes ? parseInt(Mes) : null);
        request.input('Ano', sql.Int, Ano ? parseInt(Ano) : null);

        // Ejecutar el procedimiento almacenado
        const result = await request.execute('SP_Per_ObtenerIndicadoresRegion');

        // Validar si se obtuvieron resultados
        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        // Retornar los datos
        return res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error en /indicadoresRegion:', error);
        return res.status(500).json({
            success: false,
            message: MESSAGES.DB_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Nuevo endpoint para comparar indicadores
router.get('/compararIndicadores', async (req, res) => {
    try {
        const { MesActual, AnoActual } = req.query;

        // Validar parámetros
        if (!MesActual || !AnoActual || isNaN(parseInt(MesActual)) || isNaN(parseInt(AnoActual))) {
            return res.status(400).json({
                success: false,
                message: MESSAGES.INVALID_PARAMS
            });
        }

        // Crear un objeto de solicitud SQL
        const request = new sql.Request();

        // Asignar parámetros
        request.input('MesActual', sql.Int, parseInt(MesActual));
        request.input('AnoActual', sql.Int, parseInt(AnoActual));

        // Ejecutar el procedimiento almacenado
        const result = await request.execute('sp_per_CompararIndicadores');

        // Validar si se obtuvieron resultados
        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        // Retornar los datos
        return res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error en /compararIndicadores:', error);
        return res.status(500).json({
            success: false,
            message: MESSAGES.DB_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// Endpoint para obtener la tendencia de indicadores
router.get('/tendenciaIndicadores', async (req, res) => {
    try {
        const { Ano, CodigoRegionPersona } = req.query;

        // Validar parámetros
        if (!Ano || !CodigoRegionPersona || isNaN(parseInt(Ano)) || isNaN(parseInt(CodigoRegionPersona))) {
            return res.status(400).json({
                success: false,
                message: MESSAGES.INVALID_PARAMS
            });
        }

        // Crear un objeto de solicitud SQL
        const request = new sql.Request();

        // Asignar parámetros
        request.input('Ano', sql.Int, parseInt(Ano));
        request.input('CodigoRegionPersona', sql.Int, parseInt(CodigoRegionPersona));

        // Ejecutar el procedimiento almacenado
        const result = await request.execute('sp_per_TendenciaIndicadores');

        // Validar si se obtuvieron resultados
        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        // Retornar los datos
        return res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error en /tendenciaIndicadores:', error);
        return res.status(500).json({
            success: false,
            message: MESSAGES.DB_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// Endpoint para obtener objetivo vs actual
router.get('/objetivoVsActual', async (req, res) => {
    try {
        const { Ano, CodigoRegionPersona } = req.query;

        // Validar parámetros
        if (!Ano || isNaN(parseInt(Ano))) {
            return res.status(400).json({
                success: false,
                message: MESSAGES.INVALID_PARAMS
            });
        }

        // Crear un objeto de solicitud SQL
        const request = new sql.Request();

        // Asignar parámetros
        request.input('Ano', sql.Int, parseInt(Ano));
        request.input('CodigoRegionPersona', sql.Int, CodigoRegionPersona ? parseInt(CodigoRegionPersona) : null);

        // Ejecutar el procedimiento almacenado
        const result = await request.execute('sp_per_ObjetivoVsActual');

        // Validar si se obtuvieron resultados
        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        // Retornar los datos
        return res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error en /objetivoVsActual:', error);
        return res.status(500).json({
            success: false,
            message: MESSAGES.DB_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Endpoint para obtener el semáforo de indicadores
router.get('/semaforoIndicadores', validateParams, async (req, res) => {
    try {
        const { Ano, CodigoRegionPersona } = req.query;

        // Crear un objeto de solicitud SQL
        const request = new sql.Request();

        // Asignar parámetros
        request.input('Ano', sql.Int, parseInt(Ano));
        request.input('CodigoRegionPersona', sql.Int, CodigoRegionPersona ? parseInt(CodigoRegionPersona) : null);

        // Ejecutar el procedimiento almacenado
        const result = await request.execute('sp_per_SemaforoIndicadores');

        // Validar si se obtuvieron resultados
        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        // Retornar los datos
        return res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error en /semaforoIndicadores:', error);
        return res.status(500).json({
            success: false,
            message: MESSAGES.DB_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


module.exports = router;