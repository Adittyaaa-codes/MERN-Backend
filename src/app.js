import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();// create express app

app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true ,limit:'16kb'}));
app.use(express.static("public"));
app.use(cookieParser());
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://youtube-clone-99.onrender.com',
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie']
}));

import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import likeRouter from './routes/like.routes.js'
import commentRouter from './routes/comment.routes.js'
import subscriberRouter from './routes/subscriber.routes.js'

app.use('/users',userRouter)
app.use('/videos',videoRouter)
app.use('/likes',likeRouter)
app.use('/comments',commentRouter)
app.use('/subscribers',subscriberRouter)

export default app;