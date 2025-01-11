import productModel from "../models/product.model.js";
import {v2 as cloudinary} from "cloudinary";
import mongoose from "mongoose";

const addProduct = async (req, res) => {
    try {
        const {name, description, price, category, subCategory, sizeStock, bestseller} = req.body;

        if (!name || !description || !price || !category || !subCategory || !sizeStock) {
            return res.status(400).json({
                message: "Missing required fields",
                error: "name, description, price, category, subCategory, sizeStock are required",
            });
        };

        // Validasai dan parsing sizeStock
        let parsedSizeStock;
        try {
            parsedSizeStock = JSON.parse(sizeStock);
            if (!Array.isArray(parsedSizeStock) || parsedSizeStock.length === 0) {
                return res.status(400).json({
                    message: "Invalid sizeStock format",
                    error: "sizeStock must be a non-empty array",
                });
            };

            // Validasi struktur sizeStock
            const isValidSizeStock = parsedSizeStock.every(item => 
                item.size && typeof item.stock === "number" && item.stock >= 0
            );
            if (!isValidSizeStock) {
                return res.status(400).json({
                    message: "Invalid sizeStock format",
                    error: "Each sizeStock item must have size and stock properties",
                });
            };
        } catch (error) {
            console.error("Error parsing sizes:", error);
            return res.status(400).json({
                message: "Invalid sizes format",
                error: "sizes must be a valid JSON array",
            });
        };


        // Validasi image
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "No images uploaded",
                error: "At least one image is required",
            });
        }

        // Memproses semua gambar yang dikirimkan secara bersamaan
        let imagesUrl = await Promise.all(
            req.files.map(async (file) => {
                let result = await cloudinary.uploader.upload(file.path, { resource_type: "image" });
                return result.secure_url;
            })
        );

        // Validasi price
        const numericPrice = Number(price);
        if (isNaN(numericPrice) || numericPrice <= 0) {
            return res.status(400).json({
                message: "Invalid price",
                error: "Price must be a positive number",
            });
        };

        const product = new productModel({
            name, 
            description,
            category,
            price: numericPrice,
            subCategory,
            bestseller: bestseller === "true" ? true : false,
            sizeStock: parsedSizeStock,
            image: imagesUrl,
            date: Date.now(),
        });
        await product.save();
        res.status(200).json({
            message: "Product added successfully", 
            data: product,
        });
    } catch (error) {
        console.error("Error adding product:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const listProduct = async (req, res) => {
    try {
        const {category, subCategory, bestseller, inStock} = req.query;
        const filter = {};
        if (category) {
            filter.category = category;
        };
        if (subCategory) {
            filter.subCategory = subCategory;
        };
        if (bestseller) {
            filter.bestseller = bestseller === "true";
        };
        if (inStock === "true") {
            // Filter produk yang memiliki stok > 0 untuk setidaknya satu ukuran
            filter["sizeStock.stock"] = { $gt: 0 };
        }

        const products = await productModel.find(filter);
        res.status(200).json({data: products});
    } catch (error) {
        console.error("Error listing products:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || 'An unexpected error occurred',
        });
    };
};

const removeProduct = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({message: "Invalid product ID"});
        };
        
        const product = await productModel.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({message: "Product not found"});
        };
        res.status(200).json({message: "Product deleted successfully"});
    } catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const singleProduct = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({message: "Invalid product ID"});
        };

        const produtcs = await productModel.findById(req.params.id);
        if (!produtcs) {
            return res.status(404).json({message: "Product not found"});
        };
        res.status(200).json({data: produtcs});
    } catch (error) {
        console.error("Error getting product:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const updateStock = async (req, res) => {
    try {
        const {size, stock} = req.body;
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({message: "Invalid product ID"}); 
        };
        const product = await productModel.findById(req.params.id);
        if (!product) {
            return res.status(404).json({message: "Product not found"});
        };
        // Mencari size dalam sizeStock
        const sizeIndex = product.sizeStock.findIndex(item => item.size === size);
        // Jika size tidak ditemukan
        if (sizeIndex === -1) {
            return res.status(404).json({message: "Size not found for this product"});
        };
        // Memperbarui stok
        product.sizeStock[sizeIndex].stock = stock;
        await product.save();
        res.status(200).json({
            message: "Stock updated successfully",
            data: product,
        });
    } catch (error) {
        console.error("Error updating stock:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

export {addProduct, listProduct, removeProduct, singleProduct, updateStock};