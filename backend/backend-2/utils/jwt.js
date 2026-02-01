const jwt = require('jsonwebtoken');

exports.issueJWT = (user) => {
    return jwt.sign(
        {
            user_id: user.id,
            email: user.email
        },
        'SECRET-KEY-ME',
        {
            expiresIn: '2h',
            algorithm: 'HS256'
        }
    );
}