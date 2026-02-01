exports.setAuthCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: false // true in production HTTPS
    });
};
