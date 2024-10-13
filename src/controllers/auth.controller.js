const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const CustomError = require("../utils/CustomError");
const { generateTokens, storeRefreshToken, setCookies } = require("../utils/generateTokens");
const { query } = require("../../database/db");
const config = require("../utils/config");
const client = require("../config/redis");

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

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ status: 'error', message: "Username or Password is required" });
    }

    try {
        const userQuery = `
            SELECT * FROM "User" WHERE username = $1;
        `;

        const userResult = await query(userQuery, [username]);
        if (userResult.rows.length === 0) {
            return next(new CustomError("Invalid Credentials", 401));
        };

        const user = userResult.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return next(new CustomError("Invalid Credentials", 401));
        };

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

        res.clearCookie('ca/');
        res.clearCookie('ca/*');

        res.status(200).json({ status: 'success', message: "Logged out successfully" });
        
    } catch (error) {
        console.error("Error occured in logout controller:", error);
        return res.status(500).json({ status: 'error', message: error.message || 'Internal server error' })
    }
});