const express = require('express');
const { DefaultAzureCredential } = require('@azure/identity');
const sql = require('mssql');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno desde un archivo personalizado
dotenv.config({ path: './dbaz.env' }); // Cambia el nombre si tu archivo .env tiene otro nombre

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Middlewares
app.use(cors()); // Habilita CORS para permitir solicitudes desde otros orígenes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
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

// Obtener el token de acceso
async function getAccessToken() {
    const tokenResponse = await credential.getToken("https://database.windows.net/.default");
    return tokenResponse.token;
}

// Configuración de la base de datos y conexión
async function connectToDatabase() {
    try {
        const token = await getAccessToken();

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
            }
        };

        console.log('Intentando conectar a la base de datos...');
        await sql.connect(config);
        console.log('Conexión exitosa a SQL Server');
    } catch (err) {
        if (err.code === 'ELOGIN' && err.originalError && err.originalError.message.includes('Token is expired')) {
            console.error('Token expirado, intentando renovar y reconectar...');
            await handleTokenExpiration();
        } else {
            console.error('Error al conectar a SQL Server:', err.message);
            throw err;
        }
    }
}

// Manejar la expiración del token y volver a intentar la conexión
async function handleTokenExpiration() {
    try {
        const token = await getAccessToken();

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
            }
        };

        console.log('Intentando reconectar a la base de datos con un nuevo token...');
        await sql.connect(config);
        console.log('Reconexión exitosa a SQL Server');
    } catch (err) {
        console.error('Error al reconectar a SQL Server después de la renovación del token:', err.message);
        throw err;
    }
}

// Importar rutas
const educacionRoutes = require('./routes/educacion');
const presupuestoRoutes = require('./routes/presupuesto');
const regionesRoutes = require('./routes/regiones');
const parametrosRoutes = require('./routes/parametros');
const loginRoutes = require('./routes/login');
const dppiRoutes= require('./routes/dppi');
const dpgrRoutes= require('./routes/dpgr');
const costosRoutes= require('./routes/costos');


// Registrar rutas
app.use('/api/educacion', educacionRoutes);
app.use('/api/presupuesto', presupuestoRoutes);
app.use('/api/regiones', regionesRoutes);
app.use('/api/parametros', parametrosRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/dppi', dppiRoutes);
app.use('/api/dpgr', dpgrRoutes);
app.use('/api/costos', costosRoutes);

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

// Iniciar el servidor
async function startServer() {
    try {
        console.log('Tenant ID:', process.env.AZURE_TENANT_ID || 'No definido');
        console.log('Subscription ID:', process.env.AZURE_SUBSCRIPTION_ID || 'No definido');
        console.log('Subscription Name:', process.env.AZURE_SUBSCRIPTION_NAME || 'No definido');

        await connectToDatabase();

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
            console.log('Rutas disponibles:');
            console.log('- GET /api/educacion');
            console.log('- POST /api/presupuesto');
            console.log('- GET /api/regiones');
            console.log('- GET /api/parametros');
            console.log('- POST /api/login');
            console.log('- get /api/dppi');
            console.log('- get /api/dppr');
            console.log('- get /api/costos');
        });
    } catch (err) {
        console.error('Error fatal al iniciar el servidor:', err.message);
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
