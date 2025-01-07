import express from "express";
import { addProduct } from "../controllers/product.controller.js";

const productRouter = express.Router();

productRouter.post("/add", addProduct);

export default productRouter;