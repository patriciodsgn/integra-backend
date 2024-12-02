const express = require('express');
const sql = require('mssql');

const app = express();
const PORT = 3000;

const cors = require('cors');
app.use(cors());

const config = {
    server: 'azsql-sgi-integra.database.windows.net',
    database: 'azsql-sgi-integra-bd',
    authentication: {
        type: 'azure-active-directory-default',
    },
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

// Endpoint para obtener todas las regiones de tbRegionIntegra
app.get('/api/tbRegionIntegra', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM tbRegionIntegra');
        res.json(result.recordset);
        pool.close();
    } catch (err) {
        res.status(500).send('Error al consultar la base de datos');
        console.error(err);
    }
});

// Endpoint para obtener todas las regiones de tbRegion
app.get('/api/tbRegion', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM tbRegion');
        res.json(result.recordset);
        pool.close();
    } catch (err) {
        res.status(500).send('Error al consultar la base de datos');
        console.error(err);
    }
});

// Endpoint para obtener necesidades educativas especiales (NEE)
app.get('/api/educacion/necesidades', async (req, res) => {
    const { codigoRegion, ano } = req.query;
    const query = `
        WITH Necesidades AS (
            SELECT
                n.DescripcionNEE,
                n.CategoriaNEE,
                r.NombreRegionIntegra AS DescripcionRegion,
                COUNT(*) AS Cantidad
            FROM
                tbNEE n
            INNER JOIN tbJardin j ON n.CodigoJardin = j.CodigoJardin
            INNER JOIN tbRegionIntegra r ON j.CodigoRegion = r.CodigoRegionIntegra
            WHERE
                (@CodigoRegion = 0 OR j.CodigoRegion = @CodigoRegion)
                AND n.Ano = @Ano
            GROUP BY
                n.DescripcionNEE,
                n.CategoriaNEE,
                r.NombreRegionIntegra
        )
        SELECT
            DescripcionNEE,
            CategoriaNEE,
            DescripcionRegion,
            Cantidad
        FROM
            Necesidades
        ORDER BY
            Cantidad DESC`;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('CodigoRegion', sql.Int, codigoRegion)
            .input('Ano', sql.Int, ano)
            .query(query);
        res.json(result.recordset);
        pool.close();
    } catch (err) {
        res.status(500).send('Error al consultar la base de datos');
        console.error(err);
    }
});

// Endpoint para obtener necesidades educativas por comuna
app.get('/api/educacion/necesidades/comuna', async (req, res) => {
    const { codigoRegion, ano } = req.query;
    const query = `
        WITH Necesidades AS (
            SELECT
                n.DescripcionNEE,
                n.CategoriaNEE,
                r.NombreRegionIntegra AS DescripcionRegion,
                j.Comuna,
                COUNT(*) AS Cantidad
            FROM
                tbNEE n
            INNER JOIN tbJardin j ON n.CodigoJardin = j.CodigoJardin
            INNER JOIN tbRegionIntegra r ON j.CodigoRegion = r.CodigoRegionIntegra
            WHERE
                (@CodigoRegion = 0 OR j.CodigoRegion = @CodigoRegion)
                AND n.Ano = @Ano
            GROUP BY
                n.DescripcionNEE,
                n.CategoriaNEE,
                r.NombreRegionIntegra,
                j.Comuna
        )
        SELECT
            DescripcionNEE,
            CategoriaNEE,
            DescripcionRegion,
            Comuna,
            Cantidad
        FROM
            Necesidades
        ORDER BY
            Cantidad DESC`;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('CodigoRegion', sql.Int, codigoRegion)
            .input('Ano', sql.Int, ano)
            .query(query);
        res.json(result.recordset);
        pool.close();
    } catch (err) {
        res.status(500).send('Error al consultar la base de datos');
        console.error(err);
    }
});

// Endpoint para obtener el total de necesidades educativas
app.get('/api/educacion/totalNecesidades', async (req, res) => {
    const { codigoRegion, ano } = req.query;
    const query = `
        SELECT
            COUNT(*) AS CantidadTotal
        FROM
            tbNEE n
        INNER JOIN tbJardin j ON n.CodigoJardin = j.CodigoJardin
        INNER JOIN tbRegionIntegra r ON j.CodigoRegion = r.CodigoRegionIntegra
        WHERE
            (@CodigoRegion = 0 OR j.CodigoRegion = @CodigoRegion)
            AND n.Ano = @Ano`;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('CodigoRegion', sql.Int, codigoRegion)
            .input('Ano', sql.Int, ano)
            .query(query);
        res.json(result.recordset[0]);
        pool.close();
    } catch (err) {
        res.status(500).send('Error al consultar la base de datos');
        console.error(err);
    }
});

// Endpoint para obtener el porcentaje de necesidades permanentes por comuna
app.get('/api/educacion/porcentajePermanente', async (req, res) => {
    const { codigoRegion, ano } = req.query;
    const query = `
        WITH NecesidadesPermanentes AS (
            SELECT
                j.CodigoRegion,
                r.NombreRegionIntegra AS DescripcionRegion,
                j.Comuna,
                COUNT(*) AS CantidadTotal,
                SUM(CASE WHEN n.CategoriaNEE LIKE '%Transitoria' THEN 1 ELSE 0 END) AS CantidadPermanente
            FROM
                tbNEE n
            INNER JOIN tbJardin j ON n.CodigoJardin = j.CodigoJardin
            INNER JOIN tbRegionIntegra r ON j.CodigoRegion = r.CodigoRegionIntegra
            WHERE
                (@CodigoRegion = 0 OR j.CodigoRegion = @CodigoRegion)
                AND n.Ano = @Ano
            GROUP BY
                j.CodigoRegion,
                r.NombreRegionIntegra,
                j.Comuna
        )
        SELECT
            DescripcionRegion,
            Comuna,
            (CAST(CantidadPermanente AS FLOAT) / CantidadTotal) * 100 AS PorcentajePermanente
        FROM
            NecesidadesPermanentes
        ORDER BY
            DescripcionRegion, Comuna`;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('CodigoRegion', sql.Int, codigoRegion)
            .input('Ano', sql.Int, ano)
            .query(query);
        res.json(result.recordset);
        pool.close();
    } catch (err) {
        res.status(500).send('Error al consultar la base de datos');
        console.error(err);
    }
});
// Endpoint para obtener resumen de presupuesto vigente y gastos ejecutados por dirección
app.get('/api/ejecucionPresupuesto', async (req, res) => {
    const query = `
        SELECT 
            e.CodigoDireccion,
            d.NombreDireccion,
            SUM(e.PresupuestoVigente) AS PresupuestoVigente,
            SUM(e.MontoGastosEjecutados) AS GastosEjecutados
        FROM 
            tbEjecucionPresupuestaria e
        JOIN 
            tbDireccion d ON e.CodigoDireccion = d.CodigoDireccion
        GROUP BY 
            e.CodigoDireccion, d.NombreDireccion
        ORDER BY 
            e.CodigoDireccion;
    `;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(query);
        res.json(result.recordset);
        pool.close();
    } catch (err) {
        res.status(500).send('Error al consultar la base de datos');
        console.error(err);
    }
});
// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
