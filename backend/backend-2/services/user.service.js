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

exports.findUserById = async (userId) => {
    const [users] = await pool.query(
        'SELECT id, name, email, created_at, profile_image, image_type, image_size FROM users WHERE id = ?',
        [userId]
    );
    return users[0] || null;
};

exports.checkNameAvailability = async (name, currentUserId) => {
    const [users] = await pool.query(
        'SELECT id FROM users WHERE name = ? AND id != ?',
        [name, currentUserId]
    );
    return users.length === 0;
};

exports.updateUserName = async (userId, name) => {
    const [result] = await pool.query(
        'UPDATE users SET name = ? WHERE id = ?',
        [name, userId]
    );
    return result.affectedRows > 0;
};

exports.updateUserProfileImage = async (userId, imageBuffer, imageType, imageSize) => {
    const [result] = await pool.query(
        'UPDATE users SET profile_image = ?, image_type = ?, image_size = ? WHERE id = ?',
        [imageBuffer, imageType, imageSize, userId]
    );
    return result.affectedRows > 0;
};
