exports.getAuthCookieOptions = () => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: false
});

exports.setAuthCookie = (res, token) => {
    // res.cookie('token', token, exports.getAuthCookieOptions());
    // cres.cookie('token', token);
    res.cookie("token", token, {
        httpOnly: true,
        secure: true,          // Required for HTTPS
        sameSite: "None",      // Required if frontend and backend are on different origins
        path: "/",
    });
};
