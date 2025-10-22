const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'andriu1472',
    database: 'gestionmartin'
});

module.exports = pool;