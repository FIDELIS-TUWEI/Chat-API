const express = require("express");
const router = express.Router();

router.get("/favicon.ico", (req, res) => {
    res.status(204);
});

router.get("/", (req, res) => {
    res.status(200).json({ status: "success", message: "Welcome to the Backend Chat API Server." });
})

router.all("*", (req, res) => {
    res.status(404).json({ status: "error", message: `Sorry, can't find ${req.originalUrl} on the server` });
});

module.exports = router;