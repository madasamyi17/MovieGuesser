const jwt = require('jsonwebtoken');

exports.issueJWT = (user) => {
    const secret = process.env.JWT_SECRET || 'dev-only-local-secret-change-me';
    const expiresIn = process.env.JWT_EXPIRES_IN || '2h';

    return jwt.sign(
        {
            user_id: user.id ?? user.user_id,
            email: user.email
        },
        secret,
        {
            expiresIn,
            algorithm: 'HS256'
        }
    );
}