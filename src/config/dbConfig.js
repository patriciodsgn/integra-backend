const config = {
    server: 'azsql-sgi-integra.database.windows.net',
    database: 'azsql-sgi-integra-bd',
    authentication: {
        type: 'azure-active-directory-default'
    },
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    }
};
