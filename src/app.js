import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true ,limit:'16kb'}));
app.use(express.static("public"));
app.use(cookieParser());
app.use(
  cors({
   origin: "http://localhost:5173", // frontend URL
   credentials: true                //  REQUIRED
// allow cookies / auth headers
  })
);


import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import likeRouter from './routes/like.routes.js'
import commentRouter from './routes/comment.routes.js'

app.use('/users',userRouter)
app.use('/videos',videoRouter)
app.use('/likes',likeRouter)
app.use('/comment',commentRouter)

export default app;