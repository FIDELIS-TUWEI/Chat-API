const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const { User } = require("../../models/user");
const { validationResult } = require("express-validator");
const CustomError = require("../utils/CustomError");
const { generateTokens, storeRefreshToken, setCookies } = require("../utils/generateTokens");

exports.signup = asyncHandler (async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    };

    try {
        const { username, email, password } = req.body;

        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return next(new CustomError("User already Exists", 400))
        };

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await User.Create({
            username,
            email,
            password: passwordHash
        });

        const { accessToken, refreshToken } = generateTokens(newUser.user_id);
        await storeRefreshToken(newUser.user_id, refreshToken);

        setCookies(res, accessToken, refreshToken);

        res.status(201).json({
            status: 'success',
            user: {
                id: newUser.user_id,
                username: newUser.username,
                email: newUser.email,
            }
        });

    } catch (error) {
        console.error("Error occured on signup controller:", error);
        next(error);
    }
});

exports.login = asyncHandler (async (req, res, next) => {
    
});