# Proyecto Backend: Integra

Este es un proyecto backend desarrollado con **Node.js** que utiliza **Express.js** como framework principal. Está diseñado para manejar datos de una base de datos Azure SQL y expone múltiples rutas para gestionar funcionalidades relacionadas con regiones, educación, presupuesto, y más.

## 🛠️ Estructura del Proyecto

La estructura del proyecto es modular y está organizada de la siguiente manera:

```
├── /
│   ├── dbaz.env          # Variables de entorno
│   ├── package.json      # Configuración de dependencias
│   ├── package-lock.json # Bloqueo de versiones
│   ├── README.md         # Documentación del proyecto
│   └── src               # Código fuente del backend
│       ├── app.js        # Punto de entrada principal
│       ├── config/       # Configuraciones del proyecto
│       │   └── dbConfig.js
│       ├── routes/       # Definición de rutas
│       │   ├── persona.js
│       │   ├── dpgr.js
│       │   ├── login.js
│       │   ├── regiones.js
│       │   ├── educacion.js
│       │   ├── presupuesto.js
│       │   └── parametros.js
```

## 🌟 Características Principales

- **Framework:** [Express.js](https://expressjs.com/) para la gestión de rutas y middleware.
- **Base de datos:** Integración con Azure SQL.
- **Variables de entorno:** Configuración manejada a través del archivo `dbaz.env`.
- **Estructura modular:** Rutas y configuraciones separadas para facilitar el mantenimiento.

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/usuario/proyecto-integra.git
cd proyecto-integra
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar el entorno
- Crea un archivo `.env` en el directorio raíz basado en `dbaz.env` y ajusta las variables según tus credenciales.

Ejemplo del archivo `.env`:
```plaintext
SQL_SERVER=azsql-sgi-integra.database.windows.net
SQL_DATABASE=azsql-sgi-integra-bd
AZURE_TENANT_ID=tu-tenant-id
AZURE_SUBSCRIPTION_ID=tu-subscription-id
AZURE_SUBSCRIPTION_NAME=tu-subscription-name
```

### 4. Ejecutar el proyecto
- Modo desarrollo:
  ```bash
  npm run dev
  ```
- Modo producción:
  ```bash
  npm start
  ```

## 📁 Endpoints de la API

### Principales Rutas

| Método | Ruta                | Descripción                         |
|--------|---------------------|-------------------------------------|
| GET    | `/api/regiones`     | Obtener lista de regiones           |
| GET    | `/api/educacion`    | Obtener datos educativos            |
| POST   | `/api/login`        | Autenticación de usuario            |
| GET    | `/api/presupuesto`  | Obtener datos presupuestarios       |
| GET    | `/api/parametros`   | Obtener parámetros de configuración |

## ⚙️ Dependencias Principales

Las dependencias utilizadas en este proyecto incluyen:
- **express:** Framework para Node.js.
- **dotenv:** Gestión de variables de entorno.
- **cors:** Manejo de CORS.
- **mssql:** Conexión con bases de datos SQL Server.
- **mysql2:** Cliente para bases de datos MySQL.

## 🛡️ Buenas Prácticas

- Mantén el archivo `.env` fuera del control de versiones.
- Usa `npm audit` regularmente para verificar vulnerabilidades en las dependencias.
- Configura pruebas automáticas para validar el comportamiento de las rutas.

## 📜 Licencia

<!-- Este proyecto está bajo la licencia [MIT](https://opensource.org/licenses/MIT). -->

## 💬 Contacto

- **Autor:** Patricio
- **GitHub:** [https://github.com/patriciodsgn](https://github.com/patriciodsgn)
