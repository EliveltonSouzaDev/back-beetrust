const express = require("express");
const app = express();

const cors = require("cors");
const productRoute = require('./src/routes/productRoute.js');
const chatRoute = require('./src/routes/chatRoute.js');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', productRoute);
app.use('/chat', chatRoute);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


module.exports = app;