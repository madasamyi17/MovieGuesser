const express = require('express');
const router = express.Router();

const authController = require('../controller/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
router.get('/', (req, res) => {
    res.send('Hello World!');
});

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/me', authMiddleware, authController.me);
router.get('/auth/google', authController.googleLogin);
router.get('/auth/google/callback', authController.googleCallback);



router.post('/auth/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'strict',
        secure: false // Set to true if using HTTPS
    });

    return res.status(200).json({ message: "Logged out successfully" });
});



module.exports = router;
