import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

const adminValidation = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.Authorization || req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer")) {
            token = authHeader.split(" ")[1];
            jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                if (err) {
                    return res.status(403).json({message: "Admin is not authorized"});
                };
                // Cek user di database
                const admin = await userModel.findById(decoded.user?.id || decoded.id);
                if (!admin) {
                    return res.status(404).json({message: "Admin not found"});
                };

                // Cek role admin
                if (admin.role !== "admin") {
                    return res.status(403).json({message: "Access denied. Admin access required"});
                };
                // Simpan data admin di request
                req.admin = {
                    adminId: admin._id,
                    username: user.username,
                    email: admin.email,
                    role: admin.role,
                    cart: admin.cart
                };
                next();
            });
        } else {
            return res.status(401).json({message: "Token is missing or not provided"});
        };
    } catch (error) {
        console.error("Error validating admin:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

export default adminValidation;