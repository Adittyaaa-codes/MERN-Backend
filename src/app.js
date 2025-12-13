import express from 'express';
import cookieParser from 'cookie-parser';


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true ,limit:'16kb'}));
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'

app.use('/api/v1/users',userRouter)
app.use('/videos',videoRouter)

export default app;