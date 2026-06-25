const mysql = require('mysql2/promise');

// const pool = mysql.createPool({
//     host: process.env.DB_HOST || 'localhost',
//     port: Number(process.env.DB_PORT || 3306),
//     user: process.env.DB_USER || 'root',
//     password: process.env.DB_PASSWORD || 'root',
//     // password:'MySQL@2026Secure!',
//     database: process.env.DB_NAME || 'movie_db'
// });

const pool = mysql.createPool({
    host: 'localhost',
    port:  3306,
    user: 'root',
    password: 'Madasamy*17',
    // password:'root',
    // password:'MySQL@2026Secure!',
    database: 'movie_db'
});

module.exports = pool;

//server password - MySQL@2026Secure!