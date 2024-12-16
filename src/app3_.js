const express = require('express');
const { DefaultAzureCredential } = require('@azure/identity');
const sql = require('mssql');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config({ path: './dbaz.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging de solicitudes
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Verificar variables de entorno necesarias
if (!process.env.SQL_SERVER || !process.env.SQL_DATABASE) {
    console.error('Error: Las variables de entorno SQL_SERVER y SQL_DATABASE son obligatorias.');
    process.exit(1);
}

// Managed Identity Credential
const credential = new DefaultAzureCredential();

// Variable para almacenar el pool de conexión
let pool = null;

// Función para obtener un nuevo token con reintento
async function getAccessTokenWithRetry(maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const tokenResponse = await credential.getToken("https://database.windows.net/.default");
            console.log(`Token obtenido exitosamente. Intento ${attempt}/${maxRetries}`);
            
            // Imprimir información del token
            const tokenExpiration = Math.floor(tokenResponse.expiresOnTimestamp / 1000);
            const now = Math.floor(Date.now() / 1000);
            const timeRemaining = tokenExpiration - now;
            
            console.log(`Edad del token: ${timeRemaining} segundos`);
            console.log(`Tiempo restante: ${tokenExpiration - now} segundos`);
            
            return tokenResponse.token;
        } catch (error) {
            if (attempt === maxRetries) throw error;
            console.log(`Error al obtener token. Intento ${attempt}/${maxRetries}. Reintentando en ${delay/1000} segundos...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Función mejorada de conexión con reintentos
async function connectToDatabaseWithRetry(maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const token = await getAccessTokenWithRetry();
            
            const config = {
                server: process.env.SQL_SERVER,
                database: process.env.SQL_DATABASE,
                authentication: {
                    type: 'azure-active-directory-access-token',
                    options: {
                        token: token
                    }
                },
                options: {
                    encrypt: true,
                    trustServerCertificate: false,
                    connectTimeout: 30000
                },
                pool: {
                    max: 10,
                    min: 0,
                    idleTimeoutMillis: 30000
                }
            };

            if (pool) {
                console.log('Cerrando conexión anterior...');
                await pool.close();
            }

            pool = await new sql.ConnectionPool(config);
            await pool.connect();
            console.log(`Conexión exitosa a SQL Server. Intento ${attempt}/${maxRetries}`);
            return pool;
        } catch (error) {
            console.error('Error de conexión:', error);
            if (attempt === maxRetries) throw error;
            console.log(`Reintentando conexión en ${delay/1000} segundos... Intento ${attempt}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Middleware para verificar y reconectar si es necesario
async function ensureConnection(req, res, next) {
    try {
        if (!pool || !pool.connected) {
            console.log('Conexión no disponible. Intentando reconectar...');
            await connectToDatabaseWithRetry();
        }
        next();
    } catch (error) {
        console.error('Error al asegurar la conexión:', error);
        res.status(500).json({
            success: false,
            message: 'Error de conexión a la base de datos',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
        });
    }
}

// Importar rutas
const educacionRoutes = require('./routes/educacion');
const presupuestoRoutes = require('./routes/presupuesto');
const regionesRoutes = require('./routes/regiones');
const parametrosRoutes = require('./routes/parametros');
const loginRoutes = require('./routes/login');

// Registrar rutas con middleware de conexión
app.use('/api/educacion', ensureConnection, educacionRoutes);
app.use('/api/presupuesto', ensureConnection, presupuestoRoutes);
app.use('/api/regiones', ensureConnection, regionesRoutes);
app.use('/api/parametros', ensureConnection, parametrosRoutes);
app.use('/api/login', ensureConnection, loginRoutes);

// Middleware para rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.url}`
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
});

// Función principal para iniciar el servidor
async function startServer() {
    try {
        console.log('Iniciando servidor...');
        console.log('Tenant ID:', process.env.AZURE_TENANT_ID || 'No definido');
        console.log('Subscription ID:', process.env.AZURE_SUBSCRIPTION_ID || 'No definido');
        console.log('Subscription Name:', process.env.AZURE_SUBSCRIPTION_NAME || 'No definido');

        await connectToDatabaseWithRetry();

        // Programar renovación periódica de la conexión
        setInterval(async () => {
            try {
                await connectToDatabaseWithRetry();
                console.log('Conexión renovada exitosamente');
            } catch (error) {
                console.error('Error al renovar la conexión:', error);
            }
        }, 10 * 60 * 1000); // Renovar cada 10 minutos

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
            console.log('Rutas disponibles:');
            console.log('- GET /api/educacion');
            console.log('- POST /api/presupuesto/ejecucionPresupuestoSP');
            console.log('- GET /api/regiones');
            console.log('- GET /api/parametros');
            console.log('- POST /api/login');
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
        if (pool) {
            await pool.close();
            console.log('Conexión a base de datos cerrada');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error al cerrar la conexión:', err);
        process.exit(1);
    }
});

// Manejo de rechazos no controlados
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Iniciar el servidor
startServer();