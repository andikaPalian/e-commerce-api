import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    size: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    }
}, {
    _id: false,
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    cart: {
        items: [cartItemSchema],
        totalAmount: {
            type: Number,
            default: 0,
        }
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
}, {
    minimize: false,
    timestamps: true,
});

// Menghitung total cart
userSchema.methods.calculateCartTotal = function() {
    this.cart.totalAmount = this.cart.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    return this.cart.totalAmount;
};

const userModel = mongoose.model("User", userSchema);

export default userModel;