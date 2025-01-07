import productModel from "../models/product.model.js";
import {v2 as cloudinary} from "cloudinary";

const addProduct = async (req, res) => {
    try {
        const {name, description, price, image, category, subCategory, sizes, bestseller} = req.body;

        // Memproses semua gambar yang dikirimkan secara bersamaan
        const uploadImages = Object.values(req.files || {}).flat().filter(Boolean);

        let imagesUrl = await Promise.all(
            uploadImages.map(async (image) => {
                let result = await cloudinary.uploader.upload(image.path, {resource_type: "image"});
                return result.secure_url;
            })
        );

        const product = new productModel({
            name, 
            description,
            category,
            price: Number(price),
            subCategory,
            bestseller: bestseller === "true" ? true : false,
            sizes: JSON.parse(sizes),
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

export {addProduct};