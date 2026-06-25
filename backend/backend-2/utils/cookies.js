exports.getAuthCookieOptions = () => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: false
});

exports.setAuthCookie = (res, token) => {
    res.cookie('token', token, exports.getAuthCookieOptions());
};
