const jwt = require("jsonwebtoken");
const config = require("../utils/config");
const asyncHandler = require("express-async-handler");
const { query } = require("../../database/db");

exports.protectRoute = asyncHandler (async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        if (!accessToken) {
            return res.status(401).json({ status: "error", message: "Unauthorized - No access token provided" });
        };
        
        try {
            const decoded = jwt.verify(accessToken, config.ACCESS_TOKEN_SECRET);
            const userQuery = `
                SELECT user_id, username, email FROM "User" WHERE user_id = $1;
            `;
            const userResult = await query(userQuery, [decoded.userId]);
            
            if (userResult.rows.length === 0) {
                return res.status(401).json({ status: "error", message: "Unautorized - User not found" })
            };

            req.user = userResult.rows[0];
            next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ status: "error", message: "Unautorized - Access Token expired" })
            }
        };
    } catch (error) {
        console.error("Error occured in protectRoute Middleware:", error.message);
        res.status(500).json({ status: "error", message: "Unauthorized - Invalid access token" });
    }
});