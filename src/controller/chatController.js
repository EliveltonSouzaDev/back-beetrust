const { Chat } = require("../configs/config.js");


const sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, message } = req.body;

        const orderedIds = [senderId, receiverId].sort();

        const chatId = orderedIds[0] + "_" + orderedIds[1];

        const chatDoc = await Chat.doc(chatId).get();

        if (!chatDoc.exists) {
            const newChatData = {
                senderId,
                receiverId,
                messages: [
                    {
                        senderId,
                        receiverId,
                        message,
                        createdAt: new Date(),
                    }
                ]
            };

            await Chat.doc(chatId).set(newChatData);
        } else {
            // Se o chat existir, adicione a nova mensagem às mensagens existentes no chat
            const chatData = chatDoc.data();
            chatData.messages.push({
                senderId,
                receiverId,
                message,
                createdAt: new Date(),
            });

            await Chat.doc(chatId).update({
                messages: chatData.messages
            });
        }

        res.send({ msg: "Message sent successfully" });
    } catch (error) {
        res.status(500).send({ msg: error });
        throw error;
    }
};


const getUserMessages = async (req, res) => {
    try {
        const userId = req.params.userId;
        const userMessages = [];

        const chatQuerySnapshot = await Chat.get();

        for (const chatDoc of chatQuerySnapshot.docs) {
            const chatId = chatDoc.id;

            const messageQuerySnapshot = await chatDoc.ref
                .collection("messages")
                .where("sender", "==", userId)
                .orderBy("createdAt", "desc")
                .limit(1)
                .get();

            const receivedMessagesQuerySnapshot = await chatDoc.ref
                .collection("messages")
                .where("receiver", "==", userId)
                .orderBy("createdAt", "desc")
                .limit(1)
                .get();

            const lastSentMessage = messageQuerySnapshot.empty ? null : messageQuerySnapshot.docs[0].data();
            const lastReceivedMessage = receivedMessagesQuerySnapshot.empty ? null : receivedMessagesQuerySnapshot.docs[0].data();

            const latestMessage = lastReceivedMessage && (!lastSentMessage || lastReceivedMessage.createdAt > lastSentMessage.createdAt) ? lastReceivedMessage : lastSentMessage;

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
        const chatId = req.params.chatId;
        const chatMessages = [];

        const chatRef = Chat.doc(chatId);
        const messageQuerySnapshot = await chatRef.collection("messages")
            .orderBy("createdAt", "asc")
            .get();

        messageQuerySnapshot.forEach((messageDoc) => {
            chatMessages.push(messageDoc.data());
        });

        res.send(chatMessages);
    } catch (error) {
        res.status(500).send({ msg: error });
        throw error;
    }
};



module.exports = {
    sendMessage,
    getUserMessages,
    getChatMessages,
};