
# Integra Backend

instalar dependencias
```bash
node i
```

levantar backend
```bash
node node src/app3.js
```


Este proyecto es una API desarrollada con Express.js que utiliza varias dependencias clave para conectarse a bases de datos y manejar la lógica de negocio. Aquí se detallan los pasos para configurar y ejecutar el proyecto.

## Requisitos Previos

Asegúrate de tener instalados los siguientes requisitos antes de iniciar:

- [Node.js](https://nodejs.org/) (versión 16 o superior recomendada)
- [npm](https://www.npmjs.com/) (incluido con Node.js)

## Instalación

1. Clona este repositorio:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd my-express-api
   ```

2. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```

3. Crea un archivo `.env` en la raíz del proyecto para configurar las variables de entorno necesarias. Ejemplo de contenido del archivo:

   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=password
   DB_NAME=integra
   ```

## Ejecución del Proyecto

Para iniciar el servidor en modo de desarrollo:

```bash
node node src/app3.js
```

El servidor se ejecutará por defecto en `http://localhost:3000`. Si configuraste otro puerto en las variables de entorno, asegúrate de usar ese.

## Dependencias Clave

Este proyecto utiliza las siguientes dependencias:

- **express**: Framework para construir la API.
- **cors**: Habilitación de políticas de CORS para permitir solicitudes desde otros dominios.
- **dotenv**: Manejo de variables de entorno de forma segura.
- **mysql2**: Conector para bases de datos MySQL.
- **mssql**: Conector para bases de datos SQL Server.
- **tedious**: Cliente para bases de datos SQL Server.
- **jwt-decode**: Decodificación de JSON Web Tokens.
- **@azure/ms-rest-nodeauth**: Autenticación para servicios en Azure.

## Estructura de Archivos

Estructura básica del proyecto:

```
my-express-api/
├── index.js        # Archivo principal para iniciar el servidor
├── package.json    # Configuración de dependencias y scripts
├── .env            # Variables de entorno (no se incluye en el repositorio)
└── README.md       # Este archivo
```

## Contribuir

Si deseas contribuir al proyecto:

1. Crea un fork del repositorio.
2. Crea una nueva rama para tu característica o corrección:
   ```bash
   git checkout -b feature/nueva-caracteristica
   ```
3. Realiza los cambios necesarios y realiza commit.
4. Envía un pull request.

## Licencia

Este proyecto está licenciado bajo los términos de [MIT](LICENSE).

---
¡Gracias por contribuir y mejorar este proyecto!
