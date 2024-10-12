const jwt = require("jsonwebtoken");
const config = require("./config");
const client = require("../config/redis");

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, config.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m"
    });

    const refreshToken = jwt.sign({ userId }, config.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d"
    });

    return { accessToken, refreshToken }
};

const storeRefreshToken = async (userId, refreshToken) => {
    await client.set(`refresh_token: ${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60)
};

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("ca/", accessToken, {
        httpOnly: true, // prevent XSS attacks
        secure: config.NODE_ENV === "production",
        sameSite: 'strict', // prevents CSRF attack
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cooke("ca/*", refreshToken, {
        httpOnly: true, // prevent XSS attacks
        secure: config.NODE_ENV === "production",
        sameSite: 'strict', // prevents CSRF attack
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
}

module.exports = { generateTokens, storeRefreshToken, setCookies }