import express from "express";
import { addProduct, listProduct, removeProduct, singleProduct, updateStock } from "../controllers/product.controller.js";
import upload from "../middleware/multer.js";
import adminValidation from "../middleware/adminValidation.js";

const productRouter = express.Router();

productRouter.post("/add", upload.array("images"), adminValidation, addProduct);
productRouter.get("/list", listProduct);
productRouter.delete("/delete/:id", adminValidation,removeProduct);
productRouter.get("/single/:id", singleProduct);
productRouter.put("/update-stock/:id", adminValidation, updateStock);

export default productRouter; 