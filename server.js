const express = require("express");
const app = express();
const Product = require("./config.js");
const format = require("date-fns/format");
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
    try {
        const snapshot = await Product.orderBy("createdAt", "desc").get();

        if (snapshot.empty) {
            res.status(404).send({ msg: "No products found" });
            return;
        }

        const productList = [];
        snapshot.forEach((doc) => {
            productList.push({ id: doc.id, ...doc.data() });
        });

        res.send(productList);
    } catch (error) {
        res.status(500).send({ msg: error });
    }
});

app.get("/:id", async (req, res) => {
    try {
        const productId = req.params.id;

        const productRef = Product.doc(productId);
        const productDoc = await productRef.get();

        if (!productDoc.exists) {
            res.status(404).send({ msg: "Product to add not found" });
            return;
        }

        const productData = productDoc.data();
        const productWithId = { id: productDoc.id, ...productData };

        res.send(productWithId);
    } catch (error) {
        res.status(500).send({ msg: error });
    }
});

app.get("/filter/:category", async (req, res) => {
    try {
        const category = req.params.category;
        const querySnapshot = await Product.where("category", "==", category).get();

        if (querySnapshot.empty) {
            res.status(404).send([{ msg: "No products found to category" }]);
        } else {
            const products = [];
            querySnapshot.forEach((doc) => {
                const productData = doc.data();
                const productWithId = { id: doc.id, ...productData };
                products.push(productWithId);
            });
            res.send(products);
        }
    } catch (error) {
        res.status(500).send({ msg: "An error occurred" });
    }
});

app.post("/add-product", async (req, res) => {
    console.log(req.body);
    try {
        const currentDate = new Date();
        const formattedDateTime = format(currentDate, "MM/dd/yyyy HH:mm:ss");

        const productJson = {
            walletId: req.body.walletId,
            title: req.body.title,
            description: req.body.description,
            localization: req.body.localization,
            price: req.body.price,
            images: req.body.images,
            category: req.body.category,
            createdAt: formattedDateTime,
        };
        await Product.add(productJson);
        res.send({ msg: "Product added to database" });
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: error });
    }
});

app.post("/update", async (req, res) => {
    try {
        const id = req.body.id;
        delete req.body.id;
        const data = req.body;

        data.updatedAt = format(new Date(), "MM/dd/yyyy HH:mm:ss");

        const productRef = Product.doc(id);

        const currentProductDoc = await productRef.get();
        if (!currentProductDoc.exists) {
            res.send({ msg: "Product not found" });
            return;
        }

        await productRef.update(data);

        const updatedProductDoc = await productRef.get();
        const updatedProductData = updatedProductDoc.data();

        res.send({ msg: "Updated", updatedProduct: updatedProductData });
    } catch (error) {
        res.status(500).send({ msg: error });
    }
});

app.delete("/delete", async (req, res) => {
    try {
        const id = req.body.id;
        const deletedProductRef = Product.doc(id);

        const deletedProductDoc = await deletedProductRef.get();
        if (!deletedProductDoc.exists) {
            res.status(404).send({ msg: "Product not found" });
            return;
        }

        const deletedProductData = deletedProductDoc.data();

        await deletedProductRef.delete();

        res.send({ msg: "Deleted", deletedProduct: deletedProductData });
    } catch (error) {
        res.status(500).send({ msg: error });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
