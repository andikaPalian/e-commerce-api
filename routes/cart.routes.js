import express from "express";
import userValidation from "../middleware/userValidation.js";
import { addToCart } from "../controllers/cart.controller.js";

const cartRouter = express.Router();

cartRouter.post("/add", userValidation, addToCart);

export default cartRouter;