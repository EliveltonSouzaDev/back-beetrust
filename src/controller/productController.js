const { Product } = require("../configs/config.js");
const format = require("date-fns/format");

const getAllProducts = async (req, res) => {
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
        throw error;

    }
};

const getProductById = async (req, res) => {
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
};

const getProductByCategory = async (req, res) => {
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
        res.status(500).send({ msg: error });
        throw error;

    }
};

const getMyProducts = async (req, res) => {
    try {
        const walletId = req.params.walletId;
        const querySnapshot = await Product.where("walletId", "==", walletId).get();

        if (querySnapshot.empty) {
            res.status(404).send([{ msg: "No products found for this walletId" }]);
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
        res.status(500).send({ msg: error });
    }
};

const addNewProduct = async (req, res) => {
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
        throw error;
    }
};

const updateProduct = async (req, res) => {
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
};

const deleteProduct = async (req, res) => {
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
};

const searchProduct = async (req, res) => {
    try {
        const searchTerm = req.params.search;
        const snapshot = await Product.orderBy("createdAt", "desc").get();

        const matchingProducts = [];

        snapshot.forEach((doc) => {
            const productData = doc.data();
            const { title, description } = productData;

            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                matchingProducts.push({ id: doc.id, ...productData });
            }
        });

        res.send(matchingProducts);
    } catch (error) {
        res.status(500).send({ msg: error.message });
    }
};






module.exports = {
    getAllProducts,
    getProductById,
    getProductByCategory,
    getMyProducts,
    addNewProduct,
    updateProduct,
    deleteProduct,
    searchProduct
}