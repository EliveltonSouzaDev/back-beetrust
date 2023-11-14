const { Chat } = require("../configs/config.js");


const sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, message, chatId } = req.body;

        const chatDoc = await Chat.doc(chatId).get();

        if (!chatDoc.exists) {
            const orderedIds = [senderId, receiverId].sort();

            const newChatId = chatId + "_" + orderedIds[0] + "_" + orderedIds[1];

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
                ]
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

        res.send({ msg: "Message sent successfully" });
    } catch (error) {
        res.status(500).send({ msg: error });
        throw error;
    }
};


const getUserMessages = async (req, res) => {
    try {
        console.log(req.params)
        const { id } = req.params;
        const userMessages = [];

        const chatQuerySnapshot = await Chat.get();

        for (const chatDoc of chatQuerySnapshot.docs) {
            const chatId = chatDoc.id;

            // Access the 'messages' array from the document data
            const messagesArray = chatDoc.data().messages;

            // Initialize variables for the latest messages
            let latestMessage = null;

            for (const message of messagesArray) {
                const createdAtTimestamp = message.createdAt.toDate();
                const senderId = message.senderId;
                const receiverId = message.receiverId;
                const messageContent = message.message;

                // Logic to determine the latest message within the 'messages' array
                if (
                    !latestMessage ||
                    createdAtTimestamp > latestMessage.createdAt
                ) {
                    latestMessage = {
                        createdAt: createdAtTimestamp,
                        senderId,
                        receiverId,
                        messageContent,
                    };
                }
            }

            const messageQuerySnapshot = await chatDoc.ref
                .collection("Chat")
                .where("senderId", "==", id)
                .orderBy("createdAt", "desc")
                .limit(1)
                .get();

            const receivedMessagesQuerySnapshot = await chatDoc.ref
                .collection("Chat")
                .where("receiverId", "==", id)
                .orderBy("createdAt", "desc")
                .limit(1)
                .get();

            const lastSentMessage = messageQuerySnapshot.empty
                ? null
                : messageQuerySnapshot.docs[0].data();

            const lastReceivedMessage = receivedMessagesQuerySnapshot.empty
                ? null
                : receivedMessagesQuerySnapshot.docs[0].data();

            // Determine the latest of the sent and received messages
            if (
                lastReceivedMessage &&
                (!lastSentMessage ||
                    lastReceivedMessage.createdAt > lastSentMessage.createdAt)
            ) {
                latestMessage = {
                    createdAt: lastReceivedMessage.createdAt,
                    senderId: lastReceivedMessage.senderId,
                    receiverId: lastReceivedMessage.receiverId,
                    messageContent: lastReceivedMessage.message,
                };
            } else if (lastSentMessage) {
                latestMessage = {
                    createdAt: lastSentMessage.createdAt,
                    senderId: lastSentMessage.senderId,
                    receiverId: lastSentMessage.receiverId,
                    messageContent: lastSentMessage.message,
                };
            }

            if (latestMessage) {
                userMessages.push({
                    chatId,
                    latestMessage,
                });
            }
        }

        res.send(userMessages);
    } catch (error) {
        res.status(500).send({ msg: error });
        throw error;
    }
};


const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;

        const chatDoc = await Chat.doc(chatId).get();

        if (!chatDoc.exists) {
            res.status(404).send({ msg: "Chat not found" });
            return;
        }

        const messagesArray = chatDoc.data().messages.map((message) => {
            return {
                ...message,
                chatId: chatId
            }

        })

        // Sort the messages by createdAt timestamp in ascending order
        const sortedMessages = messagesArray.sort((a, b) => a.createdAt - b.createdAt);

        res.send(sortedMessages);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send({ msg: error.message });
    }
};



module.exports = {
    sendMessage,
    getUserMessages,
    getChatMessages,
};