const { Chat } = require("../configs/config.js");
const cors = require("cors");

const express = require("express");
const socket = require("socket.io");
const app = express();

app.use(
    cors({
        origin: ["http://localhost:3000", "http://localhost:4000"],
        credentials: true,
    })
);
const server = app.listen(3001, function () {
    console.log("server running on port 3001");
});

const io = socket(server, {
    allowEIO3: true,
    cors: {
        origin: ["http://localhost:3000", "http://localhost:4000"],
        methods: ["GET", "POST"],
        credentials: true,
    },
});

io.on("connection", function (socket) {
    console.log(socket.id);
    socket.on("SEND_MESSAGE", function (data) {
        io.emit("MESSAGE", data);
    });
});


const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const chatDocRef = Chat.doc(chatId);

        // Fetch the initial data
        const chatDocSnapshot = await chatDocRef.get();

        if (!chatDocSnapshot.exists) {
            res.status(404).send({ msg: "Chat not found" });
            return;
        }

        const chatProductInfo = chatDocSnapshot.data().chatProductInfo;

        const sendInitialResponse = (messages) => {
            // Convert timestamps to milliseconds for accurate sorting
            const sortedMessages = messages.sort((a, b) => a.createdAt - b.createdAt);
            // Send the initial response to the client via HTTP
            res.send(sortedMessages);
        };

        const sendUpdatedMessages = (messages) => {
            // Emit the new messages to the client via Socket.io
            io.emit("new-messages", messages || []);
        };

        // Map the initial messages
        const initialMessages = (chatDocSnapshot.data().messages || []).map((message) => ({
            ...message,
            chatId: chatId,
            chatProductInfo,
        }));

        // Send the initial response
        sendInitialResponse(initialMessages);

        // Watch for real-time updates on the chat document
        const unsubscribe = chatDocRef.onSnapshot(
            (snapshot) => {
                const updatedMessagesArray = (snapshot.data().messages || []).map((message) => ({
                    ...message,
                    chatId: chatId,
                    chatProductInfo,
                }));

                // Send the updated messages to the client via Socket.io
                sendUpdatedMessages(updatedMessagesArray);
            },
            (error) => {
                console.error("Error in onSnapshot:", error);
                // Handle the error, if necessary
            }
        );

        // Store the unsubscribe function in the response locals to clean up the listener
        res.locals.unsubscribe = () => {
            unsubscribe();
        };
    } catch (error) {
        console.error(error);
        // Send an HTTP error response if needed
        if (!res.headersSent) {
            res.status(500).send({ msg: error.message });
        }
    }
};

const sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, message, chatId, chatProductInfo } = req.body;
        let chatDoc;
        let newChatId;


        if (!chatId) {
            const orderedIds = [senderId, receiverId].sort();

            newChatId = chatProductInfo.id + "_" + orderedIds[0] + "_" + orderedIds[1];

            chatDoc = await Chat.doc(newChatId).get();
        } else {
            chatDoc = await Chat.doc(chatId).get();
        }

        if (chatDoc && !chatDoc?.exists || !chatId) {

            const orderedIds = [senderId, receiverId].sort();

            newChatId = chatProductInfo.id + "_" + orderedIds[0] + "_" + orderedIds[1];

            const newChatData = {
                senderId,
                receiverId,
                newChatId,
                messages: [
                    {
                        senderId,
                        receiverId,
                        message,
                        createdAt: new Date(),
                    }
                ],
                chatProductInfo
            };

            await Chat.doc(newChatId).set(newChatData);
        } else {
            // If the chat exists, add the new message to the existing chat messages
            const chatData = chatDoc.data();
            chatData.messages.push({
                senderId,
                receiverId,
                message,
                createdAt: new Date(),
            });

            await Chat.doc(chatId).set({
                messages: chatData.messages
            }, { merge: true }); // Use set with merge option to update only the messages field
        }

        res.send({ chatId: newChatId, msg: "Message sent successfully" });
    } catch (error) {
        res.status(500).send({ msg: error });
        console.log(error);

        // throw new Error(error);
    }
};

const getUserMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userMessages = [];

        const chatQuerySnapshot = await Chat.get();

        for (const chatDoc of chatQuerySnapshot.docs) {
            const chatId = chatDoc.id;
            const messagesArray = chatDoc.data().messages || [];
            const chatProductInfo = chatDoc.data().chatProductInfo;

            let latestMessage = null;

            for (const message of messagesArray) {
                const createdAtTimestamp = (message.createdAt && message.createdAt.toDate()) || null;
                const senderId = message.senderId;
                const receiverId = message.receiverId;
                const messageContent = message.message;
                // Check if the message involves the specified user and has a valid timestamp
                if ((senderId === id || receiverId === id) && createdAtTimestamp) {
                    if (!latestMessage || createdAtTimestamp > latestMessage.createdAt) {
                        latestMessage = {
                            createdAt: createdAtTimestamp,
                            senderId,
                            receiverId,
                            messageContent,
                        };
                    }
                }
            }

            if (latestMessage) {
                userMessages.push({
                    chatId,
                    latestMessage,
                    chatProductInfo
                });
            }
        }

        // Sort userMessages by the timestamp of the latest message in descending order
        userMessages.sort((a, b) => (b.latestMessage?.createdAt || 0) - (a.latestMessage?.createdAt || 0));

        res.send(userMessages);
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: error });
    }
};



module.exports = {
    sendMessage,
    getUserMessages,
    getChatMessages,
};