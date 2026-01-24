import dotenv from 'dotenv';
dotenv.config();

import connectDB from './db/index.js';
import app from './app.js';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Health check endpoint
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const dbStates = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: {
            status: dbStates[dbStatus],
            readyState: dbStatus,
            host: mongoose.connection.host,
            name: mongoose.connection.name
        },
        environment: process.env.NODE_ENV || 'development'
    });
});

connectDB()
.then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Server is running on port ${PORT}`);
        console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
})
.catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
});