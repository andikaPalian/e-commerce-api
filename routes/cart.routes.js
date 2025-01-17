import express from "express";
import userValidation from "../middleware/userValidation.js";
import { addToCart, clearCart, getCart, removeFromCart, updateCartItem } from "../controllers/cart.controller.js";

const cartRouter = express.Router();

cartRouter.get("/get", userValidation, getCart);
cartRouter.post("/add", userValidation, addToCart);
cartRouter.put("/update", userValidation, updateCartItem);
cartRouter.delete("/remove", userValidation, removeFromCart);
cartRouter.delete("/clear", userValidation, clearCart);

export default cartRouter; 