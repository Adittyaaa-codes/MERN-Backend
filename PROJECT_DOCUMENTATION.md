# YouTube Backend MERN Project Documentation

## 📋 Project Overview
A MERN (MongoDB, Express.js, React.js, Node.js) backend application for a YouTube-like platform. This documentation serves as a complete reference for project setup, configuration, and development.

**Author:** Aditya Mallick  
**Repository:** [MERN-Backend](https://github.com/Adittyaaa-codes/MERN-Backend)  
**Branch:** main  
**License:** ISC  

---

## 🚀 Project Structure

```
Youtube-Backend-MERN/
├── .env                    # Environment variables (not tracked in git)
├── .gitignore             # Git ignore rules
├── .prettierrc            # Prettier configuration
├── .prettierignore        # Prettier ignore rules
├── package.json           # Node.js dependencies and scripts
├── package-lock.json      # Locked dependency versions
├── PROJECT_DOCUMENTATION.md # This documentation file
├── public/                # Static files directory
│   └── temp/             # Temporary files
└── src/                  # Source code
    ├── app.js            # Express app configuration
    ├── constants.js      # Application constants
    ├── index.js          # Main server entry point
    ├── controllers/      # Route controllers
    ├── db/               # Database configuration
    │   └── index.js      # MongoDB connection
    ├── middlewares/      # Custom middleware
    ├── models/           # Database models
    │   ├── user.models.js # User model with authentication
    │   └── video.models.js # Video model
    ├── routes/           # API routes
    └── utils/            # Utility functions
        ├── ApiError.js   # Custom error handling class
        ├── ApiResponse.js # Standardized API response
        ├── AsyncHandler.js # Async error wrapper
        └── Clodinary.js  # Cloudinary file upload service
```

---

## 📦 Dependencies

### Production Dependencies
```json
{
  "bcrypt": "^6.0.0",                        // Password hashing
  "cloudinary": "^2.8.0",                   // Cloud file storage
  "cookie-parser": "^1.4.7",                // Parse cookies in requests
  "dotenv": "^17.2.3",                      // Load environment variables
  "express": "^5.1.0",                      // Web framework
  "jsonwebtoken": "^9.0.2",                 // JWT authentication
  "mongoose": "^8.19.2",                    // MongoDB ODM
  "mongoose-aggregate-paginate-v2": "^1.1.4", // Pagination for aggregation
  "multer": "^2.0.2"                        // File upload middleware
}
```

### Development Dependencies
```json
{
  "nodemon": "^3.1.10",         // Auto-restart server on changes
  "prettier": "^3.6.2"          // Code formatting
}
```

---

## ⚙️ Configuration Files

### package.json Scripts
```json
{
  "dev": "nodemon src/index.js"  // Development server with auto-reload
}
```

### Environment Variables (.env)
```env
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret_key
```

**⚠️ Important:** Never commit `.env` file to git. It's included in `.gitignore`.

---

## 🗂️ File Breakdown

### 1. `src/index.js` - Main Server Entry Point
```javascript
import dotenv from 'dotenv';
dotenv.config();

import connectDB from './db/index.js';
import app from './app.js';

const PORT = process.env.PORT || 5000;

// Define routes before starting the server
app.get('/', (req, res) => {
    res.send('API is running...');
}); 

app.post('/name', (req, res) => {
    const name = req.body.name;
    res.send(`Hello, ${name}!`);
});

app.post('/age', (req, res) => {
    const age = req.body.age;
    res.send(`You are ${age} years old!`);
});

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

**Key Features:**
- Environment configuration loading
- Database connection before server start
- Basic API routes
- Error handling for database connection

### 2. `src/app.js` - Express Application Setup
```javascript
import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit:'16kb'}));
app.use(express.static("public"));
app.use(cookieParser());

export default app;
```

**Middleware Configuration:**
- `express.json()`: Parse JSON payloads
- `express.urlencoded()`: Parse URL-encoded data (16kb limit)
- `express.static()`: Serve static files from `public/` directory
- `cookieParser()`: Parse cookies from requests

### 3. `src/db/index.js` - Database Connection
```javascript
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async()=>{
    try {
        const connectionInstance = mongoose.connect(`${process.env.DATABASE_URL}/${DB_NAME}`);
        console.log("MongoDB connected");
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export default connectDB;
```

**Database Configuration:**
- Uses MongoDB Atlas connection
- Database name: `youtube_mern`
- Async connection with error handling

### 4. `src/constants.js` - Application Constants
```javascript
export const DB_NAME = 'youtube_mern';
```

### 5. `src/utils/Clodinary.js` - File Upload Service
```javascript
import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinary = async(localFilePath)=>{
    try{
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto",
        });
        console.log(response.url);
        fs.unlinkSync(localFilePath);
        return response;
    }catch(error){
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export default uploadCloudinary;
```

**Key Features:**
- Cloudinary integration for file uploads
- Automatic file cleanup after upload
- Support for all file types (auto detection)
- Error handling with local file cleanup

### 6. `src/utils/ApiError.js` - Custom Error Handling
```javascript
class ApiError extends Error{
    constructor(statusCode, message){
        super(message);
        this.statusCode = statusCode;
    }
}

export default ApiError;
```

### 7. `src/utils/ApiResponse.js` - Standardized API Responses
```javascript
class ApiResponse {
    constructor(success, message, data = null) {
        this.success = success;
        this.message = message;
        this.data = data;
    }
}   

export default ApiResponse;
```

### 8. `src/utils/AsyncHandler.js` - Async Error Wrapper
```javascript
const AsyncHandler = (fn) => (req,res,next) => {
    Promise.resolve(fn(req,res,next))
    .catch((error) => next(error));
}

export default AsyncHandler;
```

### 9. `src/models/user.models.js` - User Model with Authentication
```javascript
import mongoose, {Schema} from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    // Additional fields for avatar, coverImage, password, etc.
});

// Pre-save password hashing and JWT methods included
```

**Key Features:**
- User authentication with bcrypt
- JWT token generation
- Indexed fields for better performance
- Avatar and cover image support

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- MongoDB Atlas account or local MongoDB
- Git

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Adittyaaa-codes/MERN-Backend.git
   cd MERN-Backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create Environment File**
   ```bash
   # Create .env file in root directory
   echo "DATABASE_URL=your_mongodb_connection_string" > .env
   echo "PORT=5000" >> .env
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

---

## 🔧 API Endpoints

### Current Routes

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET    | `/`      | Health check | None | `"API is running..."` |
| POST   | `/name`  | Greet user  | `{"name": "John"}` | `"Hello, John!"` |
| POST   | `/age`   | Age response | `{"age": "25"}` | `"You are 25 years old!"` |

### Testing API Endpoints

#### Using cURL
```bash
# Health check
curl http://localhost:5000/

# Send name
curl -X POST http://localhost:5000/name \
  -H "Content-Type: application/json" \
  -d '{"name": "Aditya"}'

# Send age
curl -X POST http://localhost:5000/age \
  -H "Content-Type: application/json" \
  -d '{"age": "25"}'
```

#### Using Postman
1. **GET Request**
   - URL: `http://localhost:5000/`
   - Method: GET

2. **POST Request - Name**
   - URL: `http://localhost:5000/name`
   - Method: POST
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "name": "Your Name Here"
     }
     ```

3. **POST Request - Age**
   - URL: `http://localhost:5000/age`
   - Method: POST
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "age": "25"
     }
     ```

---

## 🏗️ Current Implementation Status

### ✅ Completed Components

| Component | Status | Description |
|-----------|--------|-------------|
| **Project Structure** | ✅ Complete | Professional folder organization |
| **Database Connection** | ✅ Complete | MongoDB with error handling |
| **User Model** | ✅ Complete | Authentication ready with bcrypt/JWT |
| **Video Model** | ✅ Complete | Database schema for videos |
| **File Upload Service** | ✅ Complete | Cloudinary integration |
| **Error Handling** | ✅ Complete | Custom ApiError class |
| **Response System** | ✅ Complete | Standardized ApiResponse |
| **Async Wrapper** | ✅ Complete | AsyncHandler for error management |
| **Environment Setup** | ✅ Complete | All production dependencies |

### 🚧 Ready for Implementation

| Component | Status | Description |
|-----------|--------|-------------|
| **Controllers** | 📁 Created | Folder ready for route handlers |
| **Routes** | 📁 Created | Folder ready for API endpoints |
| **Middlewares** | 📁 Created | Folder ready for custom middleware |

### 🎯 Implementation Priority

1. **High Priority** - Authentication system (register/login)
2. **High Priority** - File upload middleware (multer setup)
3. **Medium Priority** - Video CRUD operations
4. **Medium Priority** - JWT authentication middleware
5. **Low Priority** - Advanced features (pagination, search, etc.)

---

## 🛠️ Development Workflow

### Code Formatting
The project uses Prettier for code formatting:
```bash
# Format code (if prettier script is added)
npm run format
```

### Git Workflow
```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "feat: add new feature"

# Push changes
git push origin main
```

---

## 🐛 Common Issues & Solutions

### 1. Server Crashes on Start
**Problem:** `throw new TypeError('root path required')`
**Solution:** Ensure `express.static()` has a path parameter:
```javascript
app.use(express.static("public")); // ✅ Correct
app.use(express.static());         // ❌ Wrong
```

### 2. Database Connection Fails
**Problem:** MongoDB connection timeout
**Solutions:**
- Check `.env` file has correct `DATABASE_URL`
- Verify MongoDB Atlas IP whitelist
- Ensure database credentials are correct

### 3. Routes Not Working
**Problem:** Routes defined after server starts
**Solution:** Define routes before `connectDB()` call in `index.js`

### 4. Module Import Errors
**Problem:** `Cannot use import statement outside a module`
**Solution:** Ensure `"type": "module"` is in `package.json`

### 5. Cloudinary File Upload Issues
**Problem:** File not deleted after failed upload
**Solution:** Always cleanup temp files in catch block:
```javascript
// ❌ Wrong - missing parameter
fs.unlinkSync();

// ✅ Correct - include file path
fs.unlinkSync(localFilePath);
```

### 6. Missing Environment Variables
**Problem:** Cloudinary/JWT not working
**Solutions:**
- Add all required environment variables to `.env`
- Ensure `.env` file is in project root
- Restart server after adding new variables

---

## 📁 Current Advanced Structure (Implemented)

```
src/
├── controllers/          # ✅ Created (ready for implementation)
├── models/              # ✅ Implemented
│   ├── user.models.js   # ✅ User authentication model
│   └── video.models.js  # ✅ Video model
├── routes/              # ✅ Created (ready for implementation)  
├── middlewares/         # ✅ Created (ready for implementation)
├── utils/               # ✅ Fully implemented
│   ├── ApiError.js      # ✅ Custom error handling
│   ├── ApiResponse.js   # ✅ Standardized responses
│   ├── AsyncHandler.js  # ✅ Async error wrapper
│   └── Clodinary.js     # ✅ File upload service
├── db/                  # ✅ Database connection
└── app.js, index.js, constants.js  # ✅ Core files
```

### Next Implementation Steps
1. **Authentication Controller** - User registration/login
2. **File Upload Middleware** - Using multer + cloudinary
3. **Protected Routes** - JWT authentication middleware
4. **Video CRUD Operations** - Upload, view, delete videos
5. **User Profile Management** - Update profile, avatar upload

---

## 🔐 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.net` |
| `PORT` | Server port number | `5000` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your-api-secret` |

---

## 📚 Learning Resources

### Technologies Used
- **Express.js:** [Documentation](https://expressjs.com/)
- **MongoDB & Mongoose:** [Documentation](https://mongoosejs.com/)
- **Node.js:** [Documentation](https://nodejs.org/docs/)

### Completed Features
1. ✅ **Advanced Project Structure** - Scalable folder organization
2. ✅ **User Model** - Complete with authentication (bcrypt + JWT)
3. ✅ **Video Model** - Database schema for video content
4. ✅ **File Upload Service** - Cloudinary integration
5. ✅ **Error Handling** - Custom ApiError class
6. ✅ **Response Standardization** - ApiResponse class
7. ✅ **Async Error Handling** - AsyncHandler wrapper
8. ✅ **Production Dependencies** - All major packages installed

### Next Steps
1. **Implement Authentication Controller** - Registration/login endpoints
2. **Create File Upload Middleware** - Multer configuration
3. **Add JWT Authentication Middleware** - Protected routes
4. **Build Video CRUD Operations** - Upload, view, update, delete
5. **Add Input Validation** - Request validation middleware
6. **Implement User Profile Management** - Avatar/profile updates
7. **Add Pagination** - Using mongoose-aggregate-paginate-v2
8. **Add Unit Tests** - Testing framework setup

---

## 📝 Commit Message Convention

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Code style changes
- refactor: Code refactoring
- test: Adding tests
- chore: Build process or auxiliary tool changes

Examples:
- feat(auth): add user registration endpoint
- fix(db): resolve connection timeout issue
- docs: update API documentation
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'feat: add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

## 📞 Support

For issues and questions:
- **GitHub Issues:** [Create an issue](https://github.com/Adittyaaa-codes/MERN-Backend/issues)
- **Email:** Contact Aditya Mallick
- **Documentation:** Refer to this file

---

**Last Updated:** November 30, 2025  
**Version:** 2.0.0 - Advanced Architecture Implementation