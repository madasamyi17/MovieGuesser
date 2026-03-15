const axios = require('axios');
require('dotenv').config();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { issueJWT } = require('../utils/jwt');
const { setAuthCookie } = require('../utils/cookies');
const { findUserByEmail,createUser } = require('../services/user.service');
const { createAuthAccount } = require('../services/authAccount.service');
const { sendPasswordResetEmail } = require('../utils/mailer');
const {
    generateResetToken,
    storeResetToken,
    findValidToken,
    deleteTokenById,
    deleteAllUserTokens
} = require('../services/passwordReset.service');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const O_AUTH_CLIENT_ID = process.env.O_AUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
const O_AUTH_CLIENT_SECRET = process.env.O_AUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
const O_AUTH_REDIRECT_URL =
    process.env.O_AUTH_REDIRECT_URL ||
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`}/auth/google/callback`;

exports.googleLogin = (req, res) => {
    try {
        if (!O_AUTH_CLIENT_ID || !O_AUTH_REDIRECT_URL) {
            return res.status(500).json({ message: 'Google OAuth is not configured' });
        }

        // console.log(O_AUTH_CLIENT_ID)
        const params = new URLSearchParams({
            client_id: O_AUTH_CLIENT_ID,
            redirect_uri: O_AUTH_REDIRECT_URL,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'consent'
        });

        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        res.redirect(googleAuthUrl);
    }
    catch (error) {
        console.error("Error during Google OAuth login:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }

};

exports.googleCallback = async (req, res) => {
    const code = req.query.code;
    let connection;
    try {
        if (!O_AUTH_CLIENT_ID || !O_AUTH_CLIENT_SECRET || !O_AUTH_REDIRECT_URL) {
            return res.redirect(`${FRONTEND_URL}/login?error=oauth_not_configured`);
        }

        if (!code) {
            return res.status(400).json({ message: "Authorization code not provided" });
        }

        const params = new URLSearchParams({
            client_id: O_AUTH_CLIENT_ID,
            client_secret: O_AUTH_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: O_AUTH_REDIRECT_URL
        });

        const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log("tokenResponse.data", tokenResponse.data);
        const accessToken = tokenResponse.data.access_token;

        const userResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        const { email, name, id: googleId } = userResponse.data;
        console.log("Google user info:", userResponse.data);

        connection = await pool.getConnection();
        await connection.beginTransaction();

        let user = await findUserByEmail(email);
        let userId;

        if (!user) {
            userId = await createUser(connection, { email, name });
        } else {
            userId = user.id;
        }

        // check if google auth exists
        const [rows] = await connection.query(
            'SELECT id FROM auth_accounts WHERE provider = ? AND provider_id = ?',
            ['google', googleId]
        );

        if (rows.length === 0) {
            await createAuthAccount(connection, {
                user_id: userId,
                provider: 'google',
                provider_user_id: googleId
            });
        }

        await connection.commit();
        connection.release();

        const token = issueJWT({ id: userId, email });
        setAuthCookie(res, token);

        // Redirect directly to movieguess page
        // ProtectedRoute will check auth on page load
        return res.redirect(`${FRONTEND_URL}/movieguess`);
    }
    catch (error) {
        console.error("Error during Google OAuth callback:", error);
        if (connection) {
            try {
                await connection.rollback();
                connection.release();
            } catch (rollbackErr) {
                console.error("Rollback error:", rollbackErr);
            }
        }
        return res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
    }
};


exports.register = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    // check if email already exists
    const [existingUsers] = await pool.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
    );


    if (existingUsers.length > 0) {
        const connection = await pool.getConnection();

        const[authContent] = await pool.query(
            'SELECT id FROM auth_accounts WHERE user_id = ?',
            [existingUsers[0].id]
        );
        if(authContent.length > 0){
            try{
                await createAuthAccount(connection, {
                    user_id: existingUsers[0].id,
                    provider: 'password',
                    provider_user_id: null,
                    password_hash: encryptedPassword
                });
            }
            catch(err){
                console.error("Error creating auth account for existing user:", err);
                return res.status(500).json({ message: "Already registered with password" });
            }
            return res.status(201).json({ message: "User registered successfully" });
        }
        return res.status(409).json({ message: "Email already in use" });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // insert into users table
        const [userResult] = await connection.query(
            'INSERT INTO users (name, email) VALUES (?, ?)',
            [email, email]
        );

        const user_id = userResult.insertId;

        // insert into auth_accounts table
        await connection.query( 
            'INSERT INTO auth_accounts (user_id, provider, password_hash) VALUES (?, ?, ?)',
            [user_id, 'password', encryptedPassword]
        );

        await connection.commit();

        return res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        await connection.rollback();
        console.error("Error during user registration:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    } finally {
        connection.release();
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    console.log("Login attempt with email:", email);
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const [users] = await pool.query(
        'SELECT * from users where email = ?',
        [email]
    );
    if (users.length === 0) {
        return res.status(401).json({ message: "User not found" });
    }
    const user_id = users[0].id;
    const [authAccounts] = await pool.query(
        'SELECT * from auth_accounts where user_id = ? AND provider = ?',
        [user_id, 'password']
    );
    if (authAccounts.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    const passwordHash = authAccounts[0].password_hash;
    const passwordMatch = await bcrypt.compare(password, passwordHash);
    if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = issueJWT(users[0]);
    setAuthCookie(res, token);
    return res.status(200).json({ message: "Login successful" });
}

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await findUserByEmail(normalizedEmail);

        if (!user) {
            return res.status(200).json({ message: 'If the email is registered, a reset link has been sent.' });
        }

        const token = generateResetToken();
        const expiresInMinutes = Number(process.env.RESET_TOKEN_EXPIRY_MINUTES || 30);
        const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

        await storeResetToken(user.id, token, expiresAt);

        const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;

        await sendPasswordResetEmail({
            to: user.email,
            resetUrl
        });

        return res.status(200).json({ message: 'If the email is registered, a reset link has been sent.' });
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        return res.status(500).json({ message: 'Unable to process password reset request.' });
    }
};

exports.verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ message: 'Reset token is required' });
        }

        const tokenRow = await findValidToken(token);

        if (!tokenRow) {
            return res.status(400).json({ message: 'Reset link is invalid or expired' });
        }

        return res.status(200).json({ message: 'Reset token is valid' });
    } catch (error) {
        console.error('Error in verifyResetToken:', error);
        return res.status(500).json({ message: 'Unable to verify reset link.' });
    }
};

exports.resetPassword = async (req, res) => {
    let connection;
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Reset token is required' });
        }

        if (!password || password.trim().length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const tokenRow = await findValidToken(token);

        if (!tokenRow) {
            return res.status(400).json({ message: 'Reset link is invalid or expired' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [existingPasswordAuth] = await connection.query(
            'SELECT id FROM auth_accounts WHERE user_id = ? AND provider = ? LIMIT 1',
            [tokenRow.user_id, 'password']
        );

        if (existingPasswordAuth.length > 0) {
            await connection.query(
                'UPDATE auth_accounts SET password_hash = ? WHERE user_id = ? AND provider = ?',
                [hashedPassword, tokenRow.user_id, 'password']
            );
        } else {
            await connection.query(
                'INSERT INTO auth_accounts (user_id, provider, password_hash) VALUES (?, ?, ?)',
                [tokenRow.user_id, 'password', hashedPassword]
            );
        }

        await deleteTokenById(connection, tokenRow.id);
        await deleteAllUserTokens(connection, tokenRow.user_id);

        await connection.commit();
        return res.status(200).json({ message: 'Password reset successful. Please login.' });
    } catch (error) {
        console.error('Error in resetPassword:', error);
        if (connection) {
            await connection.rollback();
        }
        return res.status(500).json({ message: 'Unable to reset password.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

exports.me = async (req, res) => {
    try {
        console.log("hi");
        const user_id = req.user.user_id;

        const [users] = await pool.query(
            'SELECT id, name, email FROM users WHERE id = ?',
            [user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ user: users[0] });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { findUserById } = require('../services/user.service');
        
        const user = await findUserById(userId);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Convert profile image to base64 if exists
        const response = {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at
        };

        if (user.profile_image) {
            response.profile_image = user.profile_image.toString('base64');
            response.image_type = user.image_type;
        }

        return res.status(200).json({ user: response });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.updateUsername = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { name } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: "Name cannot be empty" });
        }

        const trimmedName = name.trim();

        const { checkNameAvailability, updateUserName } = require('../services/user.service');
        
        // Check if name is available
        const isAvailable = await checkNameAvailability(trimmedName, userId);
        
        if (!isAvailable) {
            return res.status(409).json({ message: "This username is already taken" });
        }

        // Update the name
        const updated = await updateUserName(userId, trimmedName);
        
        if (!updated) {
            return res.status(500).json({ message: "Failed to update name" });
        }

        return res.status(200).json({ 
            message: "Name updated successfully",
            name: trimmedName 
        });
    } catch (error) {
        console.error("Error updating username:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.updateProfileImage = async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        const { buffer, mimetype, size } = req.file;

        // Validate file size (max 5MB)
        if (size > 5 * 1024 * 1024) {
            return res.status(400).json({ message: "Image size must be less than 5MB" });
        }

        // Validate file type
        if (!mimetype.startsWith('image/')) {
            return res.status(400).json({ message: "File must be an image" });
        }

        const { updateUserProfileImage } = require('../services/user.service');
        
        const updated = await updateUserProfileImage(userId, buffer, mimetype, size);
        
        if (!updated) {
            return res.status(500).json({ message: "Failed to update profile image" });
        }

        return res.status(200).json({ 
            message: "Profile image updated successfully",
            profile_image: buffer.toString('base64'),
            image_type: mimetype
        });
    } catch (error) {
        console.error("Error updating profile image:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
