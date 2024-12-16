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
        const { ano, nombredireccion, rubro, subrubro } = req.query;

        // Validar que año sea requerido
        if (!ano) {
            return res.status(400).json({
                success: false,
                message: 'El año es requerido'
            });
        }

        const request = new sql.Request();

        const result = await request
            .input('Ano', sql.Int, ano)
            .input('NombreDireccion', sql.NVarChar(50), nombredireccion || null)
            .input('Rubro', sql.NVarChar(30), rubro || null)
            .input('SubRubro', sql.NVarChar(30), subrubro || null)
            .execute('sp_ObtenerDatosTarjetasConCentroGestor');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        // Como el SP retorna solo un registro, podemos devolver directamente el primer elemento
        return res.json({
            success: true,
            data: result.recordset[0]
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
        
        // Procesar los parámetros
        const params = {
            ano: parseInt(ano) || 2024,
            nombredireccion: nombredireccion || '',
            rubro: rubro || '',
            subrubro: subrubro || ''
        };

        console.log('Parámetros procesados:', params);

        const request = new sql.Request();
        const result = await request
            .input('ano', sql.Int, params.ano)
            .input('nombredireccion', sql.NVarChar(50), params.nombredireccion)
            .input('rubro', sql.NVarChar(30), params.rubro)
            .input('subrubro', sql.NVarChar(30), params.subrubro)
            .execute('sp_ObtenerPresupuestoVsEjecutado');

        if (!result.recordset?.length) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA,
                params
            });
        }

        return res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length,
            params
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
