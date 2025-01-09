import productModel from "../models/product.model.js";
import {v2 as cloudinary} from "cloudinary";
import mongoose from "mongoose";

const addProduct = async (req, res) => {
    try {
        const {name, description, price, category, subCategory, sizes, bestseller} = req.body;

        if (!name || !description || !price || !category || !subCategory || !sizes) {
            return res.status(400).json({
                message: "Missing required fields",
                error: "name, description, price, category, subCategory, sizes are required",
            });
        };

        // Validasai dan parsing sizes
        let parsedSizes;
        try {
            parsedSizes = JSON.parse(sizes);
            if (!Array.isArray(parsedSizes) || parsedSizes.length === 0) {
                return res.status(400).json({
                    message: "Invalid sizes format",
                    error: "sizes must be a non-empty array",
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
            sizes: parsedSizes,
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
        const {category, subCategory, bestseller} = req.query;
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

export {addProduct, listProduct, removeProduct, singleProduct};