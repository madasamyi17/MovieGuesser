const crypto = require('crypto');
const pool = require('../config/db');

let tableReady = false;

const ensureResetTable = async () => {
    if (tableReady) return;

    await pool.query(
        `CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT UNSIGNED NOT NULL,
            token_hash CHAR(64) NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_password_reset_user_id (user_id),
            INDEX idx_password_reset_expires_at (expires_at),
            CONSTRAINT fk_password_reset_user
                FOREIGN KEY (user_id)
                REFERENCES users(id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB`
    );

    tableReady = true;
};

const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

exports.generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

exports.storeResetToken = async (userId, rawToken, expiresAt) => {
    await ensureResetTable();

    const tokenHash = hashToken(rawToken);

    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at <= NOW()', [userId]);
    await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
        [userId, tokenHash, expiresAt]
    );
};

exports.findValidToken = async (rawToken) => {
    await ensureResetTable();

    const tokenHash = hashToken(rawToken);
    const [rows] = await pool.query(
        `SELECT id, user_id, expires_at
         FROM password_reset_tokens
         WHERE token_hash = ? AND expires_at > NOW()
         LIMIT 1`,
        [tokenHash]
    );

    return rows[0] || null;
};

exports.deleteTokenById = async (connection, tokenId) => {
    await connection.query('DELETE FROM password_reset_tokens WHERE id = ?', [tokenId]);
};

exports.deleteAllUserTokens = async (connection, userId) => {
    await connection.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
};
