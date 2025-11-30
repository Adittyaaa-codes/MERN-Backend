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
    ├── controllers/      # Route controllers (future)
    ├── db/               # Database configuration
    │   └── index.js      # MongoDB connection
    ├── middlewares/      # Custom middleware (future)
    └── routes/           # API routes (future)
```

---

## 📦 Dependencies

### Production Dependencies
```json
{
  "cookie-parser": "^1.4.7",    // Parse cookies in requests
  "dotenv": "^17.2.3",          // Load environment variables
  "express": "^5.1.0",          // Web framework
  "mongoose": "^8.19.2"         // MongoDB ODM
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

### Testing API Endpoints

#### Using cURL
```bash
# Health check
curl http://localhost:5000/

# Send name
curl -X POST http://localhost:5000/name \
  -H "Content-Type: application/json" \
  -d '{"name": "Aditya"}'
```

#### Using Postman
1. **GET Request**
   - URL: `http://localhost:5000/`
   - Method: GET

2. **POST Request**
   - URL: `http://localhost:5000/name`
   - Method: POST
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "name": "Your Name Here"
     }
     ```

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

---

## 📁 Future Structure (Scalable Architecture)

```
src/
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   └── videoController.js
├── models/
│   ├── User.js
│   ├── Video.js
│   └── Comment.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   └── videos.js
├── middlewares/
│   ├── auth.js
│   ├── upload.js
│   └── validation.js
├── utils/
│   ├── cloudinary.js
│   ├── apiError.js
│   └── apiResponse.js
└── config/
    └── database.js
```

---

## 🔐 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.net` |
| `PORT` | Server port number | `5000` |
| `JWT_SECRET` | JWT signing secret (future) | `your-secret-key` |
| `CLOUDINARY_*` | File upload config (future) | Various values |

---

## 📚 Learning Resources

### Technologies Used
- **Express.js:** [Documentation](https://expressjs.com/)
- **MongoDB & Mongoose:** [Documentation](https://mongoosejs.com/)
- **Node.js:** [Documentation](https://nodejs.org/docs/)

### Next Steps
1. Add user authentication (JWT)
2. Implement file upload (Cloudinary)
3. Create video CRUD operations
4. Add input validation middleware
5. Implement error handling middleware
6. Add unit tests

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

**Last Updated:** November 29, 2025  
**Version:** 1.0.0