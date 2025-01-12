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

const getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({message: "User ID is required"});
        };
        const user = await userModel.findById(userId).populate("cart.items.productId", "name image price");
        if (!user) {
            return res.status(404).json({message: "User not found"});
        };

        if (!user.cart) {
            return res.status(200).json({
                data: {items: []},
            });
        };
        res.status(200).json({data: user.cart});
    } catch (error) {
        console.error("Error getting cart:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const updateCartItem = async (req, res) => {
    try {
        const {productId, size, quantity} = req.body;
        const userId = req.user.id;

        const user = await userModel.findById(userId);
        const existingProduct = user.cart.items.findIndex(item => item.productId.toString() === productId && item.size === size);

        if (existingProduct === -1) {
            return res.status(404).json({message: "Product not found in cart"});
        };

        const product = await productModel.findById(productId);
        if (!product.checkStock(size, quantity)) {
            return res.status(400).json({message: "Insufficient stock"});
        };
        // Kalau jumlah barangnya di update ke 0
        if (quantity <= 0) {
            // Hapus item
            user.cart.splice(existingProduct, 1);
        } else {
            // Update quantity
            user.cart.items[existingProduct].quantity = quantity
        };

        user.calculateCartTotal();
        await user.save();
        await user.populate("cart.items.productId", "name image price");
        res.status(200).json({
            message: "Cart updated successfully",
            data: user.cart,
        });
    } catch (error) {
        console.error("Error updating cart item:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const removeFromCart = async (req, res) => {
    try {
        const {productId, size} = req.body;
        const userId = req.user.id;

        const user = await userModel.findById(userId);
        const existingProduct = user.cart.items.findIndex(item => item.productId.toString() === productId && item.size === size);
        if (existingProduct === -1) {
            return res.status(404).json({message: "Product not found in cart"});
        };

        user.cart.items.splice(existingProduct, 1);
        user.calculateCartTotal();
        await user.save();
        res.status(200).json({
            message: "Product removed from cart successfully",
            data: user.cart,
        });
    } catch (error) {
        console.error("Error removing product from cart:", error);
        return res.status(500),json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId);
        user.cart = {
            items: [],
            totalAmount: 0,
        };
        await user.save();
        res.status(200).json({
            message: "Cart cleared successfully",
            data: user.cart,
        });
    } catch (error) {
        console.error("Error clearing cart:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

export {addToCart, getCart, updateCartItem, removeFromCart, clearCart};