const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Constantes para mensajes
const MESSAGES = {
    DB_ERROR: 'Error al consultar la base de datos',
    NO_DATA: 'No se encontraron datos para los parámetros especificados',
    REQUIRED_YEAR: 'El parámetro año es requerido'
};

// Validador de parámetros reutilizable
function validateParams(ano, codigoRegion) {
    if (!ano) {
        throw new Error(MESSAGES.REQUIRED_YEAR);
    }
    return {
        ano: parseInt(ano, 10),
        codigoRegion: parseInt(codigoRegion, 10) || 0
    };
}

// Función genérica para ejecutar SPs
async function executeSP(spName, params) {
    try {
        console.log(`Ejecutando ${spName} con parámetros:`, params);
        
        const request = new sql.Request();
        const result = await request
            .input('CodigoRegion', sql.Int, params.codigoRegion)
            .input('Ano', sql.Int, params.ano)
            .execute(spName);

        console.log(`${spName} ejecutado exitosamente`);
        return result;
    } catch (error) {
        console.error(`Error ejecutando ${spName}:`, error);
        throw error;
    }
}

// Endpoints
router.get('/necesidades', async (req, res) => {
    try {
        const { ano, codigoRegion } = req.query;
        const params = validateParams(ano, codigoRegion);
        const result = await executeSP('sp_EducacionObtenerNecesidades', params);

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        // Calcular totales
        const totales = result.recordset.reduce((acc, curr) => ({
            cantidadTotal: acc.cantidadTotal + curr.Cantidad,
            necesidadesPorCategoria: {
                ...acc.necesidadesPorCategoria,
                [curr.CategoriaNEE]: (acc.necesidadesPorCategoria[curr.CategoriaNEE] || 0) + curr.Cantidad
            }
        }), { cantidadTotal: 0, necesidadesPorCategoria: {} });

        return res.json({
            success: true,
            data: result.recordset,
            summary: totales,
            count: result.recordset.length
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: MESSAGES.DB_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


router.get('/necesidades/comuna', async (req, res) => {
    try {
        const { ano, codigoRegion } = req.query;
        const params = validateParams(ano, codigoRegion);
        const result = await executeSP('sp_EducacionObtenerNecesidadesPorComuna', params);

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
            message: MESSAGES.DB_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.get('/porcentajePermanente', async (req, res) => {
    try {
        const { ano, codigoRegion } = req.query;
        const params = validateParams(ano, codigoRegion);
        const result = await executeSP('sp_EducacionObtenerPorcentajePermanente', params);

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
            message: MESSAGES.DB_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// Endpoint para obtener el porcentaje de NEE por categoría (nuevo procedimiento)
router.get('/graficoNEE', async (req, res) => {
    try {
        const { ano, codigoRegion } = req.query;
        const params = validateParams(ano, codigoRegion);
        const result = await executeSP('sp_EducacionGenerarDatosGraficoNEE', params);

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
            message: MESSAGES.DB_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// Endpoints
router.get('/porcentajeRezago', async (req, res) => {
    try {
        const { ano, codigoRegion } = req.query;
        const params = validateParams(ano, codigoRegion);
        const result = await executeSP('sp_EducacionObtenerPorcentajeRezago', params);

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
            message: MESSAGES.DB_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Nuevo endpoint: Porcentaje ATET (sp_GenerarGraficoATET)
router.get('/porcentajeATET', async (req, res) => {
    try {
        const { ano, codigoRegion } = req.query;
        const params = validateParams(ano, codigoRegion);
        const result = await executeSP('sp_GenerarGraficoATET', params);

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        // Responder con los datos obtenidos
        return res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: MESSAGES.DB_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.get('/promedioSatisfaccion', async (req, res) => {
    try {
        const { ano, codigoRegion } = req.query;
        const params = validateParams(ano, codigoRegion);
        const result = await executeSP('sp_ObtenerPromedioSatisfaccionATT', params);

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        // Responder con el promedio de satisfacción
        return res.json({
            success: true,
            data: {
                promedioSatisfaccion: result.recordset[0].PromedioSatisfaccion
            }
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: MESSAGES.DB_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.get('/satisfaccionGeografica', async (req, res) => {
    try {
        const { ano, codigoRegion } = req.query;
        const params = {
            ano: parseInt(ano, 10) || new Date().getFullYear(),
            codigoRegion: parseInt(codigoRegion, 10) || 0
        };

        const result = await executeSP('sp_ObtenerSatisfaccionGeografica', params);

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        // Procesamos los datos para el gráfico
        const data = result.recordset.map(item => ({
            region: item.Region,
            promedioSatisfaccion: item.PromedioSatisfaccion,
            totalJardines: item.TotalJardines
        }));

        // Calculamos el promedio nacional solo si estamos mostrando todas las regiones
        const summary = params.codigoRegion === 0 ? {
            promedioNacional: Number((data.reduce((acc, curr) => acc + curr.promedioSatisfaccion * curr.totalJardines, 0) / 
                              data.reduce((acc, curr) => acc + curr.totalJardines, 0)).toFixed(1))
        } : null;

        return res.json({
            success: true,
            data: data,
            count: result.recordset.length,
            summary,
            params: {
                ano: params.ano,
                codigoRegion: params.codigoRegion
            }
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: MESSAGES.DB_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.get('/cantidadTotal', async (req, res) => {
    try {
        const { ano, codigoRegion } = req.query;
        const params = validateParams(ano, codigoRegion);
        const result = await executeSP('sp_EducacionObtenerCantidadTotal', params);

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: MESSAGES.NO_DATA
            });
        }

        return res.json({
            success: true,
            data: {
                cantidadTotal: result.recordset[0].CantidadTotal
            }
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: MESSAGES.DB_ERROR,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
module.exports = router;