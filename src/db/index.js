import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async()=>{
    try {
        // Mongoose config for better compatibility
        mongoose.set('strictQuery', false);
        mongoose.set('bufferCommands', false);
        
        // Build connection string
        const connectionString = process.env.DATABASE_URL.includes(DB_NAME) 
            ? process.env.DATABASE_URL 
            : `${process.env.DATABASE_URL}/${DB_NAME}`;
            
        console.log(`🔗 Connecting to MongoDB...`);
        console.log(`📍 Database: ${DB_NAME}`);
        
        const connectionInstance = await mongoose.connect(connectionString, {
            serverSelectionTimeoutMS: 30000,  // 30 seconds
            socketTimeoutMS: 45000,           // 45 seconds
            heartbeatFrequencyMS: 10000,      // 10 seconds
            maxPoolSize: 10,                  // Maintain up to 10 connections
            minPoolSize: 2,                   // Maintain at least 2 connections
            maxIdleTimeMS: 30000,             // Close connections after 30 seconds
            connectTimeoutMS: 30000,          // 30 seconds connection timeout
            retryWrites: true,
            w: 'majority'
        });
        
        console.log(`✅ MongoDB connected! Host: ${connectionInstance.connection.host}`);
        console.log(`📊 Database: ${connectionInstance.connection.name}`);
        console.log(`🔌 Ready state: ${connectionInstance.connection.readyState}`);
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
        });
        
        return connectionInstance;
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        console.error("🔍 Error details:", {
            name: error.name,
            code: error.code,
            syscall: error.syscall,
            hostname: error.hostname
        });
        process.exit(1);
    }
}

export default connectDB;