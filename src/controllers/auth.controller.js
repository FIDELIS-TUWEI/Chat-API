const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const CustomError = require("../utils/CustomError");
const { generateTokens, storeRefreshToken, setCookies } = require("../utils/generateTokens");
const { query } = require("../../database/db");
const config = require("../utils/config");
const client = require("../config/redis");
const speakeasy = require('speakeasy');
const nodemailer = require('nodemailer');

exports.signup = asyncHandler (async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    };

    try {
        const { username, email, password } = req.body;

        const userExistsQuery = `
                SELECT * FROM "User" WHERE email = $1;
            `;
        
        const existingUser = await query(userExistsQuery, [email]);

        if (existingUser.rows.length > 0) {
            return next(new CustomError("User already Exists", 400))
        };

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const createUserQuery = `
            INSERT INTO "User" (username, email, password, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING user_id, username, email
        `;

        const newUserResult = await query(createUserQuery, [username, email, passwordHash]);
        const newUser = newUserResult.rows[0];

        const { accessToken, refreshToken } = generateTokens(newUser.user_id);
        await storeRefreshToken(newUser.user_id, refreshToken);

        setCookies(res, accessToken, refreshToken);

        res.status(201).json({
            status: 'success',
            message: "Signup Successful",
            data: {
                id: newUser.user_id,
                username: newUser.username,
                email: newUser.email,
            }
        });

    } catch (error) {
        console.error("Error occured on signup controller:", error);
        return res.status(500).json({ status: 'error', message: error.message || 'Internal server error' })
    }
});

exports.login = asyncHandler (async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    };

    const { email, password } = req.body;

    if (!email || !password) {
        return next(new CustomError("Email or Password is required", 400));
    }

    try {
        const userQuery = `
            SELECT * FROM "User" WHERE email = $1;
        `;

        const userResult = await query(userQuery, [email]);
        if (userResult.rows.length === 0) {
            return next(new CustomError("Invalid Credentials", 401));
        };

        const user = userResult.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return next(new CustomError("Invalid Credentials", 401));
        };

        if (user.mfa_enabled) {
            const verified = speakeasy.totp.verify({
                secret: user.mfa_secret,
                encoding: 'base32',
                token: mfaCode
            });

            if (!verified) {
                return next(new CustomError("Invalid MFA code", 400));
            }
        }

        const { accessToken, refreshToken } = generateTokens(user.user_id);
        await storeRefreshToken(user.user_id, refreshToken);
        setCookies(res, accessToken, refreshToken);

        res.status(200).json({
            status: 'success',
            message: "Login Successful",
            data: {
                id: user.user_id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Error occured on login controller:", error);
        return res.status(500).json({ status: 'error', message: error.message || 'Internal Server Error' });
    }
});

exports.logout = asyncHandler (async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET);
            await client.del(`refresh_token: ${decoded.userId}`);
        };

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.status(200).json({ status: 'success', message: "Logged out successfully" });

    } catch (error) {
        console.error("Error occured in logout controller:", error);
        return res.status(500).json({ status: 'error', message: error.message || 'Internal server error' })
    }
});

exports.refreshToken = asyncHandler (async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return next(new CustomError("No refresh token provided", 401));
        };

        const decoded = jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET);
        const storedToken = await client.get(`refresh_token: ${decoded.userId}`);

        if (storedToken !== refreshToken) {
            return next(new CustomError("Invalid refresh token", 401));
        };

        const accessToken = jwt.sign({ userId: decoded.userId }, config.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

        res.cookie("accessToken", accessToken, {
            httpOnly: true, 
            secure: config.NODE_ENV === "production",
            sameSite: 'strict', 
            maxAge: 15 * 60 * 1000 
        });
    
        res.status(200).json({
            status: 'success',
            message: "Token refreshed successfully"
        });

    } catch (error) {
        console.error("Error occured in refreshToken controller:", error);
        return res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
    }
});

exports.getProfile = asyncHandler (async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        console.error("Error occured in getProfile controller:", error);
        return res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
    }
});

exports.updateProfile = asyncHandler (async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    };

    const userId = req.user.user_id;
    const { username, email, password } = req.body;

    try {
        if (email) {
            const userQuery = `
                SELECT * FROM "User" WHERE email = $1 AND user_id != $2;
            `;

            const existingUser = await query(userQuery, [email, userId]);
            if (existingUser.rows.length > 0) {
                return next(new CustomError("Email is already in use.", 400));
            }
        };

        let passwordHash = null;
        if (password) {
            const salt = await bcrypt.genSalt(10)
            passwordHash = await bcrypt.hash(password, salt);
        };

        let updateFields = [];
        let updateValues = [];
        let fieldCount = 1;

        if (username) {
            updateFields.push(`username = $${fieldCount}`);
            updateValues.push(username);
            fieldCount++;
        }

        if (email) {
            updateFields.push(`email = $${fieldCount}`);
            updateValues.push(email);
            fieldCount++;
        };

        if (passwordHash) {
            updateFields.push(`password = $${fieldCount}`);
            updateValues.push(passwordHash);
            fieldCount++;
        };

        updateValues.push(userId);

        const updateUserQuery = `
            UPDATE "User"
            SET ${updateFields.join(", ")}, updated_at = NOW()
            WHERE user_id = $${fieldCount}
            RETURNING user_id, username, email, updated_at;
        `;

        const updatedUserResult = await query(updateUserQuery, updateValues);
        const updatedUser = updatedUserResult.rows[0];

        res.status(200).json({
            status: "success",
            message: "User profile updated successfully",
            data: {
                id: updatedUser.user_id,
                username: updatedUser.username,
                email: updatedUser.email,
                updatedAt: updatedUser.updated_at
            }
        });
    } catch (error) {
        console.error("Error occured while updating profile in updateProfile controller:", error);
        return res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
    }
});

exports.enableMFA = asyncHandler (async (req, res) => {
    const { email } = req.body;
    try {
        const userQuery = `
            SELECT * FROM "User" WHERE email = $1;
        `;

        const userResult = await query(userQuery, [email]);
        if (userResult.rows.length === 0) {
            return next(new CustomError("User not found", 404))
        };

        const user = userResult.rows[0];
        const secret = speakeasy.generateSecret({ length: 20 });

        await query(`UPDATE "User" SET mfa_secret = $1, mfa_enabled = true WHERE user_id = $2`, [secret.base32, user.user_id]);

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: config.EMAIL_USER,
                pass: config.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: config.EMAIL_FROM,
            to: email,
            subject: 'Your MFA Secret',
            text: `Your MFA secret is: ${secret.base32}`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ status: 'success', message: 'MFA enabled. Check your email for the secret.' });
    } catch (error) {
        console.error("Error occured in enableMFA controller:", error);
        return res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
    }
});