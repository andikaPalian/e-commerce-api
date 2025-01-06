import userModel from "../models/user.model.js";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const registerUser = async (req, res) => {
    try {
        const {username, email, password} = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({message: "All fields are required"});
        };
        // Check user exists or not
        const userExists = await userModel.findOne({email});
        if (userExists) {
            return res.status(400).json({message: "User already exists"});
        };

        // Validating email format and strong password
        if (!validator.isEmail(email)) {
            return res.json({message: "Please enter a valid email"});
        };
        if (password.lenght < 8) {
            return res.json({message: "Password must be at least 8 characters"});
        };

        // hashing password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Creating new user
        const user = new userModel({
            username,
            email,
            password: hashedPassword,
        });
        await user.save();
        res.status(201).json({
            message: "User registered successfully",
            data: user,
        })
    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;
        if (!email || !password) {
            return res.status(400).json({message: "All fields are required"});
        };
        const user = await userModel.findOne({email});
        if (!user) {
            return res.status(400).json({message: "User doesn't exists"});
        };
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({
                id: user._id,
            }, process.env.JWT_SECRET, {expiresIn: "1d"});
            user.password = undefined;
            return res.status(200).json({
                message: "User logged in successfully",
                data: {user, token},
            });
        } else {
            return res.status(401).json({message: "Invalid credentials"});
        };
    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

export {registerUser, loginUser};