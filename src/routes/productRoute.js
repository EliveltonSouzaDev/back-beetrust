const express = require("express");

// Local Modules
const productController = require('../controller/productController.js');

// Initialization
const router = express.Router();

// Requests 
router.get("/", productController.getAllProducts);

router.get("/:id", productController.getProductById);

router.get("/filter/:category", productController.getProductByCategory);

router.get("/myProducts/:walletId", productController.getMyProducts);

router.post("/add-product", productController.addNewProduct);

router.put("/update", productController.updateProduct);

router.delete("/delete", productController.deleteProduct);

router.get("/search/:search", productController.searchProduct);

module.exports = router;