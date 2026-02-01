const pool = require('../config/db');

exports.findUserByEmail = async (email) => {
    const [users] = await pool.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );
    return users[0] || null;
};

exports.createUser = async (connection, { email, name }) => {
    const [result] = await connection.query(
        'INSERT INTO users (email, name) VALUES (?, ?)',
        [email, name]
    );
    return result.insertId;
};
