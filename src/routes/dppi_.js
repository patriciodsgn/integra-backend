const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Constantes para mensajes
const MESSAGES = {
    DB_ERROR: 'Error al consultar la base de datos',
    NO_DATA: 'No se encontraron datos para los parámetros especificados',
    INVALID_REGION: 'El código de región debe ser un número válido',
    REQUIRED_YEAR: 'El año es requerido'
};

// Middleware para validar parámetros
function validateParams(req, res, next) {
    const { codigoRegion } = req.query;

    if (codigoRegion && isNaN(parseInt(codigoRegion))) {
        return res.status(400).json({
            success: false,
            message: MESSAGES.INVALID_REGION
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

router.get('/totalAccidentes', validateParams, async (req, res) => {
    try {
        const { ano, codigoRegion, codigoJardin } = req.query;
        
        const params = {
            ano: parseInt(ano) || null,
            codigoRegion: parseInt(codigoRegion) || null,
            codigoJardin: parseInt(codigoJardin) || null
        };

        const request = new sql.Request();
        const result = await request
            .input('Ano', sql.Int, params.ano)
            .input('CodigoRegion', sql.Int, params.codigoRegion)
            .input('CodigoJardin', sql.Int, params.codigoJardin)
            .execute('sp_ObtenerTotalAccidentes');

        if (!result.recordsets?.length) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        return res.json({
            success: true,
            data: {
                detalleAccidentes: result.recordsets[0],
                resumen: result.recordsets[1][0]
            },
            params
        });

    } catch (error) {
        return handleError(res, error);
    }
});
router.get('/totalesDiagnosticoNutricional', validateParams, async (req, res) => {
    try {
        const { ano, codigoRegion, codigoJardin } = req.query;
        
        const params = {
            ano: parseInt(ano) || null,
            codigoRegion: parseInt(codigoRegion) || null,
            codigoJardin: parseInt(codigoJardin) || null
        };

        const request = new sql.Request();
        const result = await request
            .input('Ano', sql.Int, params.ano)
            .input('CodigoRegion', sql.Int, params.codigoRegion)
            .input('CodigoJardin', sql.Int, params.codigoJardin)
            .execute('sp_ObtenerTotalesDiagnosticoNutricional');

        if (!result.recordset?.length) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        return res.json({
            success: true,
            data: {
                totalEvaluados: result.recordset[0].TotalNinosEvaluados,
                diagnosticos: {
                    normal: result.recordset[0].NinosNormal,
                    obesidad: result.recordset[0].NinosObesidad,
                    sobrepeso: result.recordset[0].NinosSobrepeso,
                    deficit: result.recordset[0].NinosDeficit
                }
            },
            params
        });

    } catch (error) {
        return handleError(res, error);
    }
});

router.get('/informacionClaraOportuna', validateParams, async (req, res) => {
    try {
        const { anio, codigoRegion } = req.query;
        
        const params = {
            anio: parseInt(anio) || null,
            codigoRegion: parseInt(codigoRegion) || null
        };

        const request = new sql.Request();
        const result = await request
            .input('Anio', sql.Int, params.anio)
            .input('CodigoRegion', sql.Int, params.codigoRegion)
            .execute('sp_ObtenerInformacionClaraOportuna');

        if (!result.recordset?.length) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        return res.json({
            success: true,
            data: {
                totalEncuestados: result.recordset[0].TotalEncuestados,
                deAcuerdo: result.recordset[0].DeAcuerdo,
                enDesacuerdo: result.recordset[0].EnDesacuerdo,
                porcentajes: {
                    acuerdo: result.recordset[0].PorcentajeAcuerdo,
                    desacuerdo: result.recordset[0].PorcentajeDesacuerdo
                }
            },
            params
        });

    } catch (error) {
        return handleError(res, error);
    }
});
router.get('/informacionGeografica', validateParams, async (req, res) => {
    try {
        const { anio, codigoRegion } = req.query;
        const params = {
            anio: parseInt(anio) || null,
            codigoRegion: parseInt(codigoRegion) || null
        };

        const request = new sql.Request();
        const result = await request
            .input('Anio', sql.Int, params.anio)
            .input('CodigoRegion', sql.Int, params.codigoRegion)
            .execute('sp_ObtenerInformacionGeografica');

        if (!result.recordset?.length) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        return res.json({
            success: true,
            data: result.recordset.map(item => ({
                nombreRegion: item.NombreRegion,
                totalEncuestados: item.TotalEncuestados,
                deAcuerdo: item.DeAcuerdo,
                enDesacuerdo: item.EnDesacuerdo
            })),
            params
        });

    } catch (error) {
        return handleError(res, error);
    }
});
module.exports = router;