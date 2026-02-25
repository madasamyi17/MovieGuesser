const express = require('express');
const router = express.Router();
const multer = require('multer');

const authController = require('../controller/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Configure multer for memory storage
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.get('/', (req, res) => {
    res.send('Hello World!');
});

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.get('/auth/reset-password/verify/:token', authController.verifyResetToken);
router.post('/auth/reset-password/:token', authController.resetPassword);
router.post('/auth/me', authMiddleware, authController.me);
router.get('/auth/profile', authMiddleware, authController.getProfile);
router.put('/auth/profile/username', authMiddleware, authController.updateUsername);
router.put('/auth/profile/image', authMiddleware, upload.single('image'), authController.updateProfileImage);
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
