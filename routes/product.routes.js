import express from "express";
import { addProduct, listProduct, removeProduct } from "../controllers/product.controller.js";
import upload from "../middleware/multer.js";

const productRouter = express.Router();

productRouter.post("/add", upload.array("images") , addProduct);
productRouter.get("/list", listProduct);
productRouter.delete("/delete/:id",removeProduct);

export default productRouter;