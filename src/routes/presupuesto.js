const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Constantes para mensajes y queries
const MESSAGES = {
    DB_ERROR: 'Error al consultar la base de datos',
    NO_DATA: 'No se encontraron datos para los parámetros especificados',
    MISSING_PARAM: 'El parámetro "Ano" es obligatorio.'
};

// Middleware para validar parámetros
function validateParams(req, res, next) {
    const { Ano } = req.body;
    if (!Ano) {
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
router.post('/obtenerDatosTarjetas', validateParams, async (req, res) => {
    try {
        console.log('Recibiendo petición:', req.body);
        const { Ano, NombreDireccion, Rubro, SubRubro, CodigoCentroGestor } = req.body;

        const result = await sql.request()
            .input('Ano', sql.Int, Ano)
            .input('NombreDireccion', sql.NVarChar(50), NombreDireccion || null)
            .input('Rubro', sql.NVarChar(30), Rubro || null)
            .input('SubRubro', sql.NVarChar(30), SubRubro || null)
            .input('CodigoCentroGestor', sql.NVarChar(20), CodigoCentroGestor)
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
router.post('/obtenerFlujoSaldo', validateParams, async (req, res) => {
    try {
        console.log('Recibiendo petición:', req.body);
        const { Ano, NombreDireccion, Rubro, SubRubro } = req.body;

        const result = await sql.request()
            .input('Ano', sql.Int, Ano)
            .input('NombreDireccion', sql.NVarChar(50), NombreDireccion || null)
            .input('Rubro', sql.NVarChar(30), Rubro || null)
            .input('SubRubro', sql.NVarChar(30), SubRubro || null)
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
router.post('/obtenerGastosVsSaldo', validateParams, async (req, res) => {
    const dbConfig = {
        user: 'tu_usuario',
        password: 'tu_contraseña',
        server: 'tu_servidor',
        database: 'tu_base_de_datos',
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    };

    try {
        const pool = await sql.connect(dbConfig);
        const { Ano, NombreDireccion, Rubro, SubRubro } = req.body;

        const result = await pool.request()
            .input('Ano', sql.Int, Ano)
            .input('NombreDireccion', sql.NVarChar(50), NombreDireccion || null)
            .input('Rubro', sql.NVarChar(30), Rubro || null)
            .input('SubRubro', sql.NVarChar(30), SubRubro || null)
            .execute('sp_ObtenerGastosEjecutadosVsSaldoPorGastar');

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
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: MESSAGES.DB_ERROR
        });
    }
});

// Endpoint para ejecutar sp_ObtenerPorcentajeEjecucionVsSaldo
router.post('/obtenerPorcentajeEjecucionVsSaldo', validateParams, async (req, res) => {
    try {
        console.log('Recibiendo petición:', req.body);
        const { Ano, NombreDireccion, Rubro, SubRubro } = req.body;

        const result = await sql.request()
            .input('Ano', sql.Int, Ano)
            .input('NombreDireccion', sql.NVarChar(50), NombreDireccion || null)
            .input('Rubro', sql.NVarChar(30), Rubro || null)
            .input('SubRubro', sql.NVarChar(30), SubRubro || null)
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
// Endpoint para ejecutar sp_ObtenerPresupuestoComprometidoVsEjecutado
router.post('/api/presupuesto/obtenerPresupuestoComprometidoVsEjecutado', validateParams, async (req, res) => {
    try {
        const { Ano, NombreDireccion, Rubro, SubRubro } = req.body;

        // Conexión al pool
        const pool = await sql.connect();

        // Ejecución del procedimiento almacenado
        const result = await pool.request()
            .input('Ano', sql.Int, Ano)
            .input('NombreDireccion', sql.NVarChar(50), NombreDireccion || null)
            .input('Rubro', sql.NVarChar(30), Rubro || null)
            .input('SubRubro', sql.NVarChar(30), SubRubro || null)
            .execute('sp_ObtenerPresupuestoComprometidoVsEjecutado');

        // Verificar resultados
        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron datos para los parámetros especificados.',
            });
        }

        // Responder con los datos
        res.json({
            success: true,
            data: result.recordset,
        });
    } catch (error) {
        console.error('Error en el endpoint /obtenerPresupuestoComprometidoVsEjecutado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al consultar la base de datos',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});

// Endpoint para ejecutar sp_ObtenerPresupuestoVsEjecutado
router.post('/obtenerPresupuestoVsEjecutado', validateParams, async (req, res) => {
    try {
        console.log('Recibiendo petición:', req.body);
        const { Ano, NombreDireccion, Rubro, SubRubro } = req.body;

        const result = await sql.request()
            .input('Ano', sql.Int, Ano)
            .input('NombreDireccion', sql.NVarChar(50), NombreDireccion || null)
            .input('Rubro', sql.NVarChar(30), Rubro || null)
            .input('SubRubro', sql.NVarChar(30), SubRubro || null)
            .execute('sp_ObtenerPresupuestoVsEjecutado');

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
// Endpoint para ejecutar sp_ObtenerPresupuestoVsGastos
router.post('/obtenerPresupuestoVsGastos', validateParams, async (req, res) => {
    try {
        console.log('Recibiendo petición:', req.body);
        const { Ano, NombreDireccion, Rubro, SubRubro } = req.body;

        const result = await sql.request()
            .input('Ano', sql.Int, Ano)
            .input('NombreDireccion', sql.NVarChar(50), NombreDireccion || null)
            .input('Rubro', sql.NVarChar(30), Rubro || null)
            .input('SubRubro', sql.NVarChar(30), SubRubro || null)
            .execute('sp_ObtenerPresupuestoVsGastos');

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

// Endpoint para ejecutar sp_PresupuestoVigenteVsEjecutado
router.post('/presupuestoVigenteVsEjecutado', validateParams, async (req, res) => {
    try {
        console.log('Recibiendo petición:', req.body);
        const { Ano, CodigoDireccion, Rubro, SubRubro } = req.body;

        const result = await sql.request()
            .input('Ano', sql.Int, Ano)
            .input('CodigoDireccion', sql.Char(4), CodigoDireccion || null)
            .input('Rubro', sql.NVarChar(30), Rubro || null)
            .input('SubRubro', sql.NVarChar(30), SubRubro || null)
            .execute('sp_PresupuestoVigenteVsEjecutado');

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
        console.log('Recibiendo petición para obtener años de ejecución presupuestaria.');

        const result = await sql.request()
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
