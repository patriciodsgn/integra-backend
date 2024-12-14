const express = require('express');
const sql = require('mssql');
const cors = require('cors');

// Inicialización de Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para logging de peticiones
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Configuración de SQL Server
const config = {
    server: 'azsql-sgi-integra.database.windows.net',
    database: 'azsql-sgi-integra-bd',
    authentication: {
        type: 'azure-active-directory-default',
    },
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Conexión a la base de datos
async function connectToDatabase() {
    try {
        await sql.connect(config);
        console.log('Conexión exitosa a SQL Server');
    } catch (err) {
        console.error('Error al conectar a SQL Server:', err);
        throw err; // Lanzamos el error en lugar de terminar el proceso
    }
}

// Importar las rutas
const educacionRoutes = require('./routes/educacion');
const presupuestoRoutes = require('./routes/presupuesto');
const regionesRoutes = require('./routes/regiones');
const parametrosRoutes = require('./routes/parametros');
const loginRoutes = require('./routes/login');
// Utilizar las rutas
app.use('/api/educacion', educacionRoutes);
app.use('/api/presupuesto', presupuestoRoutes);
app.use('/api/regiones', regionesRoutes);
app.use('/api/parametros', parametrosRoutes);
app.use('/api/login', loginRoutes);
// Middleware para rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.url}`
    });
});

// Manejo mejorado de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
});

// Iniciar el servidor
async function startServer() {
    try {
        await connectToDatabase();
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
            console.log('Rutas disponibles:');
            console.log('- POST /api/presupuesto/ejecucionPresupuestoSP');
            console.log('- Otras rutas de educacion y regiones...');
        });
    } catch (err) {
        console.error('Error fatal al iniciar el servidor:', err);
        process.exit(1);
    }
}

// Manejo de señales de terminación
process.on('SIGTERM', async () => {
    console.log('Cerrando servidor gracefully...');
    try {
        await sql.close();
        console.log('Conexión a base de datos cerrada');
        process.exit(0);
    } catch (err) {
        console.error('Error al cerrar la conexión:', err);
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();