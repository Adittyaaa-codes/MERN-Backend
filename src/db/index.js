import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async()=>{
    try {
        const connectionInstance = mongoose.connect(`${process.env.DATABASE_URL}/${DB_NAME}`);
        console.log("MongoDB connected");
        // console.log(connectionInstance);
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export default connectDB;