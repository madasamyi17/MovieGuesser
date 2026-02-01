exports.createAuthAccount = async (
    connection,
    { user_id, provider, provider_user_id = null, password_hash = null }
) => {
    await connection.query(
        `INSERT INTO auth_accounts 
        (user_id, provider, provider_id, password_hash)
        VALUES (?, ?, ?, ?)`,
        [user_id, provider, provider_user_id, password_hash]
    );
};
