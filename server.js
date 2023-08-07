const express = require("express");
const app = express();
const Product = require("./config.js");
const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
    try {
        const snapshot = await Product.get();
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        res.send(list);
    } catch (error) {
        res.send({ msg: error });
    }
});

app.get("/:id", async (req, res) => {
    try {
        const snapshot = await Product.get();
        const list = snapshot.docs.filter((doc) => (doc.id === req.params.id)).map((doc) => ({ id: doc.id, ...doc.data() }));
        res.send(list);
    } catch (error) {
        res.send({ msg: error });
    }
});

//pendente get by category
app.get("/getByCategory", async (req, res) => {
    const category = req.body.category;
    try {
        const snapshot = await Product.get();
        const list = snapshot.doc(category).data();
        res.send(list);
    } catch (error) {
        res.send({ msg: error });
    }
});

app.post("/add", async (req, res) => {
    try {
        const productJson = {
            walletId: req.body.walletId,
            title: req.body.title,
            description: req.body.description,
            localization: req.body.localization,
            price: req.body.price,
            images: req.body.images,
            category: req.body.category,
            createdAt: Date.now(),//revisar como salvar a data
        };
        await Product.add(productJson);
        res.send({ msg: "Product added to database" });
    } catch (error) {
        res.send({ msg: error });
    }
});

app.post("/update", async (req, res) => {
    try {
        const id = req.body.id;
        delete req.body.id;
        const data = req.body;
        await Product.doc(id).update(data);
        res.send({ msg: "Updated" });
    } catch (error) {
        res.send({ msg: error });
    }

});

app.delete("/delete", async (req, res) => {
    try {
        const id = req.body.id;
        await Product.doc(id).delete();
        res.send({ msg: "Deleted" });
    } catch (error) {
        res.send({ msg: error });
    }

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
