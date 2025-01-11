import userModel from "../models/user.model.js";
import productModel from "../models/product.model.js";

const addToCart = async (req, res) => {
    try {
        const {productId, quantity, size} = req.body;
        const userId = req.user.id;

        if (!productId || !quantity || !size) {
            return res.status(400).json({message: "Missing required fields"});
        };

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({message: "Product not found"});
        };
        // Cek ketersediaan stock
        if (!product.checkStock(size, quantity)) {
            return res.status(400).json({message: "Insufficient stock"});
        };
        
        const user = await userModel.findById(userId);
        // Cek apakah produk sudah ada di keranjang
        const existingProduct = user.cart.items.findIndex(item => item.productId.toString() === productId && item.size === size);
        // Jika ada
        if (existingProduct > -1) {
            // Update quantity jika produk sudah ada di keranjang
            const newQuantity = user.cart.items[existingProduct].quantity + quantity
            // Cek stok untuk quantity baru
            if (!product.checkStock(size, newQuantity)) {
                return res.status(400).json({message: "Insufficient stock for total quantity"});
            };
            user.cart.items[existingProduct].quantity = newQuantity;
        // Jika product belum ada di keranjang
        } else {
            // Tambah item baru ke keranjang
            user.cart.items.push({
                productId,
                size,
                quantity,
                price: product.price,
            });
        };
        // Hitung ulang total cart
        user.calculateCartTotal();
        await user.save();

        // Populate product data
        await user.populate("cart.items.productId", "name image");

        res.status(200).json({
            message: "Product added to cart successfully",
            data: user.cart,
        });
    } catch (error) {
        console.error("Error adding product to cart:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

export {addToCart};