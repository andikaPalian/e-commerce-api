import express from "express";
import { addProduct } from "../controllers/product.controller.js";
import upload from "../middleware/multer.js";

const productRouter = express.Router();

productRouter.post("/add", upload.array("images") , addProduct);

export default productRouter;