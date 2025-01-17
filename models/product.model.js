import mongoose from "mongoose";

const sizeStockSchema = new mongoose.Schema({
    size: {
        type: String,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
}, {
    _id: false,
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    image: {
        type: Array,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    subCategory: {
        type: String,
        required: true,
    },
    sizeStock: [sizeStockSchema],
    bestseller: {
        type: Boolean,
    },
    date: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
});

// Mengecek ketersediaan stock
productSchema.methods.checkStock = function(size, quantity) {
    const sizeStock = this.sizeStock.find(item => item.size === size);
    // Memeriksa apakaha size atau ukuran ada
    if (!sizeStock) {
        return false;
    };
    // Membandingkan stok dengan quantity
    // Jika ukuran ditemukan, fungsi memeriksa apakah stok yang tersedia (sizeStock.stock) cukup untuk memenuhi kuantitas yang diminta (quantity).
    return sizeStock.stock >= quantity;
};

// Method untuk mengurangi stock
productSchema.methods.decreaseStock = function(size, quantity) {
    const sizeStock = this.sizeStock.find(item => item.size === size);
    // Memeriksa apakaha size atau ukuran ada
    if (!sizeStock) {
        return false;
    };
    // Memeriksa apakah stok mencukupi
    if (sizeStock.stock < quantity) {
        return false;
    };
    sizeStock.stock -= quantity;
    return true;
}

const productModel = mongoose.model("Product", productSchema);

export default productModel; 