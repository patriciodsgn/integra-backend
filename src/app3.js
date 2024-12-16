const express = require('express');
const { DefaultAzureCredential } = require('@azure/identity');
const sql = require('mssql');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config({ path: './dbaz.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Variables para el manejo del token
let lastTokenTime = null;
let tokenExpirationTime = 3600 * 1000; // 1 hora en milisegundos por defecto

// Configuración de Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging de peticiones
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

// Función para obtener el token con tracking de tiempo
async function getAccessToken() {
    try {
        const tokenResponse = await credential.getToken("https://database.windows.net/.default");
        lastTokenTime = Date.now();
        console.log('Nuevo token generado:', new Date(lastTokenTime).toISOString());
        
        if (tokenResponse.expiresOn) {
            tokenExpirationTime = tokenResponse.expiresOn.getTime() - Date.now();
            console.log('Tiempo de expiración del token:', tokenExpirationTime / 1000, 'segundos');
        }
        
        return tokenResponse.token;
    } catch (error) {
        console.error('Error al obtener el token:', error);
        throw error;
    }
}

// Función para verificar si el token está por expirar
function isTokenExpiringSoon() {
    if (!lastTokenTime) return true;
    
    const tokenAge = Date.now() - lastTokenTime;
    const timeToExpiration = tokenExpirationTime - tokenAge;
    const expirationThreshold = 5 * 60 * 1000; // 5 minutos antes de expirar
    
    console.log('Edad del token:', tokenAge / 1000, 'segundos');
    console.log('Tiempo restante:', timeToExpiration / 1000, 'segundos');
    
    return timeToExpiration < expirationThreshold;
}

// Configuración de la base de datos y conexión
async function connectToDatabase() {
    try {
        if (isTokenExpiringSoon()) {
            console.log('Token próximo a expirar o expirado, renovando...');
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
        }
    } catch (err) {
        if (err.code === 'ELOGIN' && err.originalError && err.originalError.message.includes('Token is expired')) {
            console.error('Token expirado, iniciando proceso de renovación...');
            await handleTokenExpiration();
        } else {
            console.error('Error al conectar a SQL Server:', err.message);
            throw err;
        }
    }
}

// Manejar la expiración del token
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
const dppiRoutes = require('./routes/dppi');
const dpgrRoutes = require('./routes/dpgr');
const costosRoutes = require('./routes/costos');
const personaRoutes = require('./routes/persona');

const helloWorld = (req, res, next) => {
    res.send('¡Hola Mundo!');
    next(); // Esto es opcional si no tienes otros middlewares o rutas
};

// Registrar rutas
app.use('/api/educacion', educacionRoutes);
app.use('/api/presupuesto', presupuestoRoutes);
app.use('/api/regiones', regionesRoutes);
app.use('/api/parametros', parametrosRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/dppi', dppiRoutes);
app.use('/api/dpgr', dpgrRoutes);
app.use('/api/costos', costosRoutes);
app.use('/api/persona', personaRoutes);
app.use('/', helloWorld);

// Middleware para rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.url}`
    });
});

// Manejo de errores global con soporte para renovación de token
app.use(async (err, req, res, next) => {
    if (err.code === 'ELOGIN' || err.message?.includes('token')) {
        console.error('Error de autenticación detectado:', err.message);
        try {
            await handleTokenExpiration();
            return next();
        } catch (tokenError) {
            console.error('Error al renovar el token:', tokenError);
        }
    }
    
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
});

// Verificación periódica del token
const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos
setInterval(async () => {
    if (isTokenExpiringSoon()) {
        console.log('Verificación periódica: Token próximo a expirar, renovando...');
        try {
            await handleTokenExpiration();
        } catch (error) {
            console.error('Error en la renovación periódica del token:', error);
        }
    }
}, TOKEN_CHECK_INTERVAL);

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
            console.log('- GET /api/dppi');
            console.log('- GET /api/dpgr');
            console.log('- GET /api/costos');
            console.log('- GET /api/persona');
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