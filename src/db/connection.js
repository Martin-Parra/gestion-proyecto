const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Martin125',
    database: 'gestion_proyectos'
});

module.exports = pool;