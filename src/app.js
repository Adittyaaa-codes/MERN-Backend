import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

app.set("trust proxy", 1);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "https:"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: {
        statusCode: 429,
        message: "Too many requests from this IP. Please try again later.",
        data: null,
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test"
});

app.use(globalLimiter);

const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "https://youtube-clone-99.onrender.com",
];

if (process.env.NODE_ENV !== "production") {
    allowedOrigins.push(
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    );
}

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) {
            return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["set-cookie"]
}));

app.use(express.json({ limit: "16kb" }));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import likeRouter from "./routes/like.routes.js";
import commentRouter from "./routes/comment.routes.js";
import subscriberRouter from "./routes/subscriber.routes.js";

app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/videos", videoRouter);
app.use("/likes", likeRouter);
app.use("/comment", commentRouter);
app.use("/subscribe", subscriberRouter);

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
    });
});

app.use((req, res, next) => {
    res.status(404).json({
        statusCode: 404,
        message: "Route not found",
        data: null,
        success: false
    });
});

app.use((err, req, res, next) => {
    console.error("Error:", err);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    res.status(statusCode).json({
        statusCode,
        message,
        data: null,
        success: false,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
});

export default app;