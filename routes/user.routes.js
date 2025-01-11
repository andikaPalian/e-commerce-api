import express from "express";
import { loginAdmin, loginUser, registerAdmin, registerUser } from "../controllers/user.controller.js";
import adminValidation from "../middleware/adminValidation.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/register-admin", adminValidation, registerAdmin);
userRouter.post("/login", loginUser);
userRouter.post("/login-admin", loginAdmin);

export default userRouter;