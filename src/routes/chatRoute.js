const express = require("express");

// Local Modules
const chatController = require('../controller/chatController.js');

// Initialization
const router = express.Router();

// Requests 
router.post("/send-message", chatController.sendMessage);

router.get("/get-user-messages", chatController.getUserMessages);

router.get("/get-chat-messages", chatController.getChatMessages);



module.exports = router;