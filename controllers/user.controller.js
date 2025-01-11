import userModel from "../models/user.model.js";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const registerUser = async (req, res) => {
    try {
        const {username, email, password, role} = req.body;
        if (!username?.trim() || !email?.trim() || !password?.trim()) {
            return res.status(400).json({message: "All fields are required"});
        };
        // Check user exists or not
        const userExists = await userModel.findOne({
            email: email.toLowerCase(),
            role: "user",
        });
        if (userExists) {
            return res.status(409).json({message: "User already exists"});
        };

        // Validating email format and strong password
        if (!validator.isEmail(email)) {
            return res.json({message: "Please enter a valid email"});
        };
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.json({message: "Password must be at least 8 characters long and contain uppercase, lowercase, number and special characters"});
        };

        // hashing password
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = new userModel({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: "user",
            cart: {
                items: [],
                totalAmount: 0,
            },
        });
        await user.save();
        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;
        res.status(201).json({
            message: "User registered successfully",
            data: userResponse,
        });
    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const registerAdmin = async (req, res) => {
    try {
        const {username, email, password, role} = req.body;
        if (!username?.trim() || !email?.trim() || !password?.trim()) {
            return res.status(400).json({message: "All fields are required"});
        };
        const adminExists = await userModel.findOne({
            email: email.toLowerCase(),
            role: "admin",
        });
        if (adminExists) {
            return res.status(409).json({message: "Admin already exists"});
        };

        if (!validator.isEmail(email)) {
            return res.json({message: "Please enter a valid email"});
        };
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.json({message: "Password must be at least 8 characters long and contain uppercase, lowercase, number and special characters"});
        };

        const hashedPassword = await bcrypt.hash(password, 12);
        const admin = new userModel({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: "admin",
            cart: {
                items: [],
                totalAmount: 0,
            },
        });
        await admin.save();
        // Remove password from response
        const adminResponse = admin.toObject();
        delete adminResponse.password;
        res.status(201).json({
            message: "Admin registered successfully",
            data: adminResponse,
        })
    } catch (error) {
        console.error("Error registering admin:", error);
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
        const user = await userModel.findOne({email, role: "user"});
        if (!user) {
            return res.status(400).json({message: "User doesn't exists"});
        };
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({
                id: user._id,
                role: "user",
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

const loginAdmin = async (req, res) => {
    try {
        const {email, password} = req.body;
        if (!email || !password) {
            return res.status(400).json({message: "All fields are required"});
        };
        const admin = await userModel.findOne({email, role: "admin"});
        if (!admin) {
            return res.status(400).json({message: "Admin deosn't exists"});
        };
        const isMatch = await bcrypt.compare(password, admin.password);
        if (isMatch) {
            const token = jwt.sign({
                id: admin._id,
                role: "admin"
            }, process.env.JWT_SECRET, {expiresIn: "1d"});
            admin.password = undefined;
            return res.status(200).json({
                message: "Admin logged in successfully",
                data: {admin, token},
            });
        } else {
            return res.status(401).json({message: "Invalid credentials"});
        };
    } catch (error) {
        console.error("Error logging in admin:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

export {registerUser, registerAdmin, loginUser, loginAdmin};