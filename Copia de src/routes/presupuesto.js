const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Constantes para mensajes y queries
const MESSAGES = {
    DB_ERROR: 'Error al consultar la base de datos',
    NO_DATA: 'No se encontraron datos para los parámetros especificados',
    MISSING_PARAM: 'El parámetro "ano" es obligatorio.'
};

// Middleware para validar parámetros
function validateParams(req, res, next) {
    const { ano } = req.query;
    if (!ano) {
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

// Endpoint para ejecutar sp_ObtenerDatosTarjetasConCentroGestor
router.get('/obtenerDatosTarjetas', validateParams, async (req, res) => {
    try {
        const { ano, nombredireccion, rubro, subrubro, codigocentrogestor } = req.query;

        const request = new sql.Request();
        const defaultCentroGestor = codigocentrogestor || '';

        const result = await request
            .input('ano', sql.Int, ano)
            .input('nombredireccion', sql.NVarChar(50), nombredireccion || null)
            .input('rubro', sql.NVarChar(30), rubro || null)
            .input('subrubro', sql.NVarChar(30), subrubro || null)
            .input('codigocentrogestor', sql.NVarChar(20), defaultCentroGestor)
            .execute('sp_ObtenerDatosTarjetasConCentroGestor');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        return res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        });

    } catch (error) {
        return handleError(res, error);
    }
});

// Endpoint para ejecutar sp_ObtenerFlujoSaldoPorEjecutar
router.get('/obtenerFlujoSaldo', validateParams, async (req, res) => {
    try {
        const { ano, nombredireccion, rubro, subrubro } = req.query;

        const request = new sql.Request();
        const result = await request
            .input('ano', sql.Int, ano)
            .input('nombredireccion', sql.NVarChar(50), nombredireccion || null)
            .input('rubro', sql.NVarChar(30), rubro || null)
            .input('subrubro', sql.NVarChar(30), subrubro || null)
            .execute('sp_ObtenerFlujoSaldoPorEjecutar');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        return res.json({
            success: true,
            data: result.recordset[0] // Este SP devuelve un solo registro
        });

    } catch (error) {
        return handleError(res, error);
    }
});

// Endpoint para ejecutar sp_ObtenerGastosEjecutadosVsSaldoPorGastar
router.get('/obtenerGastosVsSaldo', validateParams, async (req, res) => {
    try {
        const { ano, nombredireccion, rubro, subrubro } = req.query;

        const request = new sql.Request();
        const result = await request
            .input('ano', sql.Int, ano)
            .input('nombredireccion', sql.NVarChar(50), nombredireccion || null)
            .input('rubro', sql.NVarChar(30), rubro || null)
            .input('subrubro', sql.NVarChar(30), subrubro || null)
            .execute('sp_ObtenerGastosEjecutadosVsSaldoPorGastar');
            console.log('Resultados del SP:', result);
        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        return res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        });

    } catch (error) {
        return handleError(res, error);
    }
});

// Endpoint para ejecutar sp_ObtenerPorcentajeEjecucionVsSaldo
router.get('/obtenerPorcentajeEjecucionVsSaldo', validateParams, async (req, res) => {
    try {
        const { ano, nombredireccion, rubro, subrubro } = req.query;

        const request = new sql.Request();
        const result = await request
            .input('ano', sql.Int, ano)
            .input('nombredireccion', sql.NVarChar(50), nombredireccion || null)
            .input('rubro', sql.NVarChar(30), rubro || null)
            .input('subrubro', sql.NVarChar(30), subrubro || null)
            .execute('sp_ObtenerPorcentajeEjecucionVsSaldo');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        return res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        });

    } catch (error) {
        return handleError(res, error);
    }
});

router.get('/obtenerPresupuestoVsEjecutado', validateParams, async (req, res) => {
    try {
        const { ano, nombredireccion, rubro, subrubro } = req.query;

        console.log('Parámetros recibidos:', { ano, nombredireccion, rubro, subrubro });

        const request = new sql.Request();
        const result = await request
            .input('ano', sql.Int, ano)
            .input('nombredireccion', sql.NVarChar(50), nombredireccion || null)
            .input('rubro', sql.NVarChar(30), rubro || null)
            .input('subrubro', sql.NVarChar(30), subrubro || null)
            .execute('sp_ObtenerPresupuestoVsEjecutado');
            console.log('Resultados del SP:', result);
        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        return res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        });

    } catch (error) {
        return handleError(res, error);
    }
});

// Endpoint para ejecutar sp_ObtenerAniosEjecucionPresupuestaria
router.get('/obtenerAniosEjecucion', async (req, res) => {
    try {
        const request = new sql.Request();

        const result = await request
            .execute('sp_ObtenerAniosEjecucionPresupuestaria');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

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
