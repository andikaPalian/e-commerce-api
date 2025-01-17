import mongoose from "mongoose";

const db = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Database connected : ${connect.connection.host} ${connect.connection.name}`);
    } catch (error) {
        console.error("Error connecting to database", error);
        process.exit(1);
    };
};

export default db; 