const { Chat } = require("../configs/config.js");


const sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, message, chatId } = req.body;
        console.log(chatId, 'chatId')
        let chatDoc;
        if (chatId !== null) {
            chatDoc = await Chat.doc(chatId).get();
        }

        if (chatDoc && !chatDoc?.exists || !chatId) {

            const orderedIds = [senderId, receiverId].sort();
            console.log(orderedIds, 'aaaaaa')

            const newChatId = orderedIds[0] + "_" + orderedIds[1];

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
        throw new Error(error);
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
                });
            }
        }

        // Sort userMessages by the timestamp of the latest message in descending order
        userMessages.sort((a, b) => (b.latestMessage?.createdAt || 0) - (a.latestMessage?.createdAt || 0));

        res.send(userMessages);
    } catch (error) {
        res.status(500).send({ msg: error });
        throw new Error(error);
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
        res.status(500).send({ msg: error.message });
        throw new Error(error);
    }
};



module.exports = {
    sendMessage,
    getUserMessages,
    getChatMessages,
};