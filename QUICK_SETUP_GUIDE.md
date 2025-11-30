# 🚀 Quick Setup Guide

## For New Projects (Copy this setup)

### 1. Initialize Project
```bash
mkdir new-mern-project
cd new-mern-project
npm init -y
```

### 2. Install Dependencies
```bash
# Production dependencies
npm install express mongoose dotenv cookie-parser

# Development dependencies
npm install -D nodemon prettier
```

### 3. Update package.json
```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  }
}
```

### 4. Create Folder Structure
```bash
mkdir src public
mkdir src/controllers src/db src/middlewares src/routes src/models src/utils
mkdir public/temp
```

### 5. Essential Files

#### src/app.js
```javascript
import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static("public"));
app.use(cookieParser());

export default app;
```

#### src/constants.js
```javascript
export const DB_NAME = 'your_database_name';
```

#### src/db/index.js
```javascript
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.DATABASE_URL}/${DB_NAME}`);
        console.log(`MongoDB connected! Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection error:", error);
        process.exit(1);
    }
}

export default connectDB;
```

#### src/index.js
```javascript
import dotenv from 'dotenv';
dotenv.config();

import connectDB from './db/index.js';
import app from './app.js';

const PORT = process.env.PORT || 5000;

// Routes
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Start server
connectDB()
.then(() => {
    console.log('Database connected successfully');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
.catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
});
```

#### .env
```env
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net
PORT=5000
NODE_ENV=development
```

#### .gitignore
```
node_modules/
.env
.env.local
.env.production
*.log
.DS_Store
public/temp/*
```

### 6. Start Development
```bash
npm run dev
```

## 🔧 Common Commands

```bash
# Install new package
npm install package-name

# Install dev dependency
npm install -D package-name

# Start development server
npm run dev

# Check for updates
npm outdated

# Update packages
npm update
```

## 📝 Git Setup

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/username/repo.git
git push -u origin main
```