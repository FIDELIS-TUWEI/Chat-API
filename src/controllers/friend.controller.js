const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const CustomError = require("../utils/CustomError");
const { query } = require("../../database/db");


exports.sendFriendRequest = asyncHandler (async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const userId = req.user.user_id;
    const { friendId } = req.body;

    try {
        // validate friend ID
        if (userId === friendId) {
            return next(new CustomError("Cannot send friend request to yourself", 400));
        }

        // check if friend exists
        const friendExists = await query(
            `SELECT user_id FROM "User" WHERE user_id = $1`,
            [friendId]
        );

        if (friendExists.rows.length === 0) {
            return next(new CustomError("User not found", 404));
        }

        // check if friendship already exists
        const existingFriendShip = await query(
            `SELECT * FROM "Friendship" WHERE (user_id = $1 AND friend_user_id = $2) OR (user_id = $2 AND friend_user_id = $1)`,
            [userId, friendId]
        );

        if (existingFriendShip.rows.length > 0) {
            const friendShip = existingFriendShip.rows[0];
            if (friendShip.status === 'accepted') {
                return next (new CustomError("Already friends", 400))
            }
            if (friendShip.status === 'pending') {
                return next(new CustomError("Friend request already pending", 400));
            }
        };

        // create friendship request
        const newFriendship = await query(
            `INSERT INTO "Friendship" (user_id, friend_user_id, status, created_at, updated_at) VALUES($1, $2, $3, NOW(), NOW()) RETURNING *`,
            [userId, friendId, 'pending']
        );

        // create notification for the friend
        await query(
            `INSERT INTO "Notification" (user_id, message, type, created_at) VALUES ($1, $2, $3, NOW())`,
            [friendId, `You have a new friend request`, 'FRIEND_REQUEST']
        );

        res.status(201).json({
            status: "success",
            message: "Friend request sent successfully",
            data: newFriendship.rows[0]
        });
    } catch (error) {
        console.error("Error in sendFriendRequest controller:", error);
        return res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
    }
});