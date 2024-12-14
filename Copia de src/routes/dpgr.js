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

// Endpoint para obtener conteo de jardines
router.get('/conteoJardines', validateParams, async (req, res) => {
    try {
        console.log('Recibiendo petición de conteo de jardines:', req.query);
        const codigoRegion = parseInt(req.query.codigoRegion) || 0;

        const request = new sql.Request();
        const result = await request
            .input('CodigoRegion', sql.Int, codigoRegion)
            .execute('sp_ContarJardinesPorRegion');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        const data = result.recordset.map(item => ({
            region: item.Region,
            totalJardines: item.TotalJardines
        }));

        const totalGeneral = data.reduce((acc, curr) => acc + curr.totalJardines, 0);

        return res.json({
            success: true,
            data: data,
            count: data.length,
            summary: {
                totalGeneral: totalGeneral
            },
            params: {
                codigoRegion: codigoRegion
            }
        });

    } catch (error) {
        return handleError(res, error);
    }
});

// Endpoint para obtener total de niños originarios
router.get('/totalNinosOriginarios', validateParams, async (req, res) => {
    try {
        console.log('Recibiendo petición de total niños originarios:', req.query);
        const codigoRegion = parseInt(req.query.codigoRegion) || 0;
        const ano = parseInt(req.query.ano);

        const request = new sql.Request();
        const result = await request
            .input('Ano', sql.Int, ano)
            .input('CodigoRegion', sql.Int, codigoRegion)
            .execute('sp_ObtenerTotalNinosOriginarios');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        return res.json({
            success: true,
            data: {
                totalNinosOriginarios: result.recordset[0].TotalNinosOriginarios
            },
            params: {
                ano: ano,
                codigoRegion: codigoRegion
            }
        });

    } catch (error) {
        return handleError(res, error);
    }
});

// Endpoint para obtener total de niños migrantes
router.get('/totalNinosMigrantes', async (req, res) => {
    try {
        console.log('Recibiendo petición de total niños migrantes:', req.query);
        const { ano, codigoRegion } = req.query;

        if (!ano) {
            return res.status(400).json({
                success: false,
                message: MESSAGES.REQUIRED_YEAR
            });
        }

        const params = {
            ano: parseInt(ano),
            codigoRegion: parseInt(codigoRegion) || 0
        };

        const request = new sql.Request();
        const result = await request
            .input('Ano', sql.Int, params.ano)
            .input('CodigoRegion', sql.Int, params.codigoRegion)
            .execute('sp_ObtenerTotalNinosMigrantes');

        if (!result.recordsets || result.recordsets.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        const [totales, detallePorNacionalidad] = result.recordsets;

        return res.json({
            success: true,
            data: {
                totales: {
                    totalNinosMigrantes: totales[0].TotalNinosMigrantes,
                    totalJardinesConMigrantes: totales[0].TotalJardinesConMigrantes
                },
                detallePorNacionalidad: detallePorNacionalidad.map(item => ({
                    nacionalidad: item.NacionalidadPO,
                    totalNinos: item.TotalNinos
                }))
            },
            count: detallePorNacionalidad.length,
            params
        });

    } catch (error) {
        return handleError(res, error);
    }
});

// Endpoint para obtener total de jardines con RO
router.get('/totalJardinesRO', async (req, res) => {
    try {
        console.log('Recibiendo petición de total jardines RO:', req.query);
        const { anoRO, codigoRegion } = req.query;

        if (!anoRO) {
            return res.status(400).json({
                success: false,
                message: MESSAGES.REQUIRED_YEAR
            });
        }

        const params = {
            anoRO: parseInt(anoRO),
            codigoRegion: parseInt(codigoRegion) || 0
        };

        const request = new sql.Request();
        const result = await request
            .input('AnoRO', sql.Int, params.anoRO)
            .input('CodigoRegion', sql.Int, params.codigoRegion)
            .execute('sp_ObtenerTotalJardinesRO');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        const datos = result.recordset[0];

        return res.json({
            success: true,
            data: {
                totalJardinesConRO: datos.TotalJardinesConRO,
                totalJardinesROIntegra: datos.TotalJardinesROIntegra,
                totalJardinesROSdEP: datos.TotalJardinesROSdEP,
                totalJardines: datos.TotalJardines
            },
            params
        });

    } catch (error) {
        return handleError(res, error);
    }
});

// Endpoint para obtener total de jardines con sello verde
router.get('/totalJardinesSelloVerde', async (req, res) => {
    try {
        console.log('Recibiendo petición de total jardines sello verde:', req.query);
        const { anoSV, codigoRegion } = req.query;

        if (!anoSV) {
            return res.status(400).json({
                success: false,
                message: MESSAGES.REQUIRED_YEAR
            });
        }

        const params = {
            anoSV: parseInt(anoSV),
            codigoRegion: parseInt(codigoRegion) || 0
        };

        const request = new sql.Request();
        const result = await request
            .input('AnoSV', sql.Int, params.anoSV)
            .input('CodigoRegion', sql.Int, params.codigoRegion)
            .execute('sp_ObtenerTotalJardinesSelloVerde');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        const datos = result.recordset[0];

        return res.json({
            success: true,
            data: {
                totalJardinesVigentes: datos.TotalJardinesVigentes,
                totalJardinesCerrados: datos.TotalJardinesCerrados,
                totalJardines: datos.TotalJardines
            },
            params
        });

    } catch (error) {
        return handleError(res, error);
    }
});
// Endpoint para obtener frecuencia de pueblos originarios
router.get('/frecuenciaPueblosOriginarios', validateParams, async (req, res) => {
    try {
        console.log('Recibiendo petición de frecuencia pueblos originarios:', req.query);
        const { codigoRegion, codigoJardin, ano } = req.query;

        const params = {
            codigoRegion: parseInt(codigoRegion) || 0,
            codigoJardin: parseInt(codigoJardin) || 0,
            ano: parseInt(ano) || 0
        };

        const request = new sql.Request();
        const result = await request
            .input('CodigoRegion', sql.Int, params.codigoRegion)
            .input('CodigoJardin', sql.Int, params.codigoJardin)
            .input('Ano', sql.Int, params.ano)
            .execute('sp_ObtenerFrecuenciaPueblosOriginarios');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        const data = result.recordset.map(item => ({
            region: item.Region,
            nombreRegion: item.NombreRegion,
            provincia: item.Provincia,
            comuna: item.Comuna,
            frecuencia: item.Frecuencia
        }));

        const totalFrecuencia = data.reduce((acc, curr) => acc + curr.frecuencia, 0);

        return res.json({
            success: true,
            data: data,
            count: data.length,
            summary: {
                totalFrecuencia: totalFrecuencia
            },
            params: params
        });

    } catch (error) {
        return handleError(res, error);
    }
});

router.get('/estadisticasRO', validateParams, async (req, res) => {
    try {
        console.log('Recibiendo petición de estadísticas RO:', req.query);
        const { ano, codigoRegion, codigoJardin } = req.query;

        // Validar la presencia del año después del middleware
        if (!ano) {
            console.log('Año no proporcionado en la petición');
            return res.status(400).json({
                success: false,
                message: "El año es requerido"
            });
        }

        const params = {
            anoRO: parseInt(ano),
            codigoRegion: parseInt(codigoRegion) || 0,
            codigoJardin: parseInt(codigoJardin) || 0
        };

        console.log('Parámetros procesados:', params);

        const request = new sql.Request();
        const result = await request
            .input('AnoRO', sql.Int, params.anoRO)
            .input('CodigoRegion', sql.Int, params.codigoRegion)
            .input('CodigoJardin', sql.Int, params.codigoJardin)
            .execute('sp_ObtenerEstadisticasRO');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No se encontraron datos para los parámetros proporcionados"
            });
        }

        // Procesamiento de estadísticas igual que antes...
        const estadisticasPorTipo = {};
        result.recordset.forEach(item => {
            if (!estadisticasPorTipo[item.TipoEstablecimiento]) {
                estadisticasPorTipo[item.TipoEstablecimiento] = {
                    totalJardines: 0,
                    conReconocimiento: 0
                };
            }
            estadisticasPorTipo[item.TipoEstablecimiento].totalJardines += item.TotalJardines;
            estadisticasPorTipo[item.TipoEstablecimiento].conReconocimiento += item.ConReconocimiento;
        });

        const estadisticasFormateadas = Object.entries(estadisticasPorTipo).map(([tipo, stats]) => ({
            tipoEstablecimiento: tipo,
            totalJardines: stats.totalJardines,
            conReconocimiento: stats.conReconocimiento,
            porcentaje: Math.round((stats.conReconocimiento / stats.totalJardines) * 100)
        }));

        return res.json({
            success: true,
            data: {
                estadisticas: estadisticasFormateadas,
                detalleJardines: result.recordset.map(item => ({
                    region: item.NombreRegion,
                    codigoJardin: item.CodigoJardin,
                    nombreJardin: item.NombreJardin,
                    tipoEstablecimiento: item.TipoEstablecimiento,
                    comuna: item.Comuna,
                    provincia: item.Provincia,
                    estadoRO: item.EstadoRO,
                    fechaRO: item.FechaRO,
                    tienePlacaROIntegra: item.TienePlacaROIntegra,
                    tienePlacaSdEP: item.TienePlacaSdEP
                }))
            },
            params
        });

    } catch (error) {
        console.error('Error en estadísticasRO:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
router.get('/graficoSelloVerde', validateParams, async (req, res) => {
    try {
        console.log('Recibiendo petición de gráfico sello verde:', req.query);
        const { anoSV, codigoRegion, codigoJardin } = req.query;

        const params = {
            anoSV: parseInt(anoSV) || null,
            codigoRegion: parseInt(codigoRegion) || null,
            codigoJardin: parseInt(codigoJardin) || null
        };

        const request = new sql.Request();
        const result = await request
            .input('AnoSV', sql.Int, params.anoSV)
            .input('CodigoRegion', sql.Int, params.codigoRegion)
            .input('CodigoJardin', sql.Int, params.codigoJardin)
            .execute('sp_ObtenerSelloVerdeGrafico');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        return res.json({
            success: true,
            data: result.recordset.map(item => ({
                año: item.Año,
                totalSellos: item.TotalSellos,
                totalJardines: item.TotalJardines,
                porcentaje: item.Porcentaje
            })),
            params
        });

    } catch (error) {
        return handleError(res, error);
    }
});

router.get('/porcentajeNacionalidadExtranjera', validateParams, async (req, res) => {
    try {
        console.log('Recibiendo petición de porcentaje nacionalidad extranjera:', req.query);
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
            .execute('sp_ObtenerPorcentajeNacionalidadExtranjera');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        const totalGeneral = result.recordset[0].TotalGeneral;
        const totalExtranjeros = result.recordset.reduce((acc, curr) => acc + curr.TotalPorNacionalidad, 0);
        
        return res.json({
            success: true,
            data: {
                detalleNacionalidades: result.recordset.map(item => ({
                    nacionalidad: item.NacionalidadPO,
                    total: item.TotalPorNacionalidad,
                    porcentaje: item.Porcentaje
                })),
                resumen: {
                    totalGeneral,
                    totalExtranjeros,
                    porcentajeExtranjeros: (totalExtranjeros * 100.0 / totalGeneral).toFixed(2)
                }
            },
            params
        });

    } catch (error) {
        return handleError(res, error);
    }
});

// Endpoint
router.get('/porcentajePueblosOriginarios', validateParams, async (req, res) => {
    try {
        const { ano, codigoRegion } = req.query;

        const params = {
            ano: parseInt(ano) || null,
            codigoRegion: parseInt(codigoRegion) || null
        };

        const request = new sql.Request();
        const result = await request
            .input('Ano', sql.Int, params.ano)
            .input('CodigoRegion', sql.Int, params.codigoRegion)
            .execute('sp_ObtenerPorcentajePueblosOriginarios');

        if (!result.recordset?.length) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        return res.json({
            success: true,
            data: {
                detallePueblos: result.recordset.map(item => ({
                    pueblo: item.Pueblo,
                    total: item.Total,
                    porcentaje: item.Porcentaje
                })),
                totalGeneral: result.recordset[0].TotalGeneral
            },
            params
        });

    } catch (error) {
        return handleError(res, error);
    }
});
router.get('/nacionalidadPorGeografia', validateParams, async (req, res) => {
    try {
        const { ano, codigoRegion } = req.query;
        
        const params = {
            ano: parseInt(ano) || null,
            codigoRegion: parseInt(codigoRegion) || null
        };

        const request = new sql.Request();
        const result = await request
            .input('Ano', sql.Int, params.ano)
            .input('CodigoRegion', sql.Int, params.codigoRegion)
            .execute('sp_ObtenerNacionalidadPorGeografia');

        if (!result.recordset?.length) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        const geograficoData = {};
        result.recordset.forEach(item => {
            const comuna = item.Comuna;
            if (!geograficoData[comuna]) {
                geograficoData[comuna] = {
                    nombreRegion: item.NombreRegion,
                    direccionRegional: item.DireccionRegional,
                    nacionalidades: {}
                };
            }
            geograficoData[comuna].nacionalidades[item.NacionalidadPO] = item.Total;
        });

        return res.json({
            success: true,
            data: geograficoData,
            params
        });

    } catch (error) {
        return handleError(res, error);
    }
});



module.exports = router;