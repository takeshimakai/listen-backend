import './config/passport.js';
import './config/mongoDB.js';

import express from 'express';
import passport from 'passport';
import cors from 'cors';
import { createServer } from 'http';

import socket from './socket.io/socket.js';

import authRouter from './routes/authRouter.js';
import userRouter from './routes/userRouter.js';
import postRouter from './routes/forum/postRouter.js';
import commentRouter from './routes/forum/commentRouter.js';

const app = express();

app.use(passport.initialize());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/user', passport.authenticate('jwt', { session: false }), userRouter);
app.use('/api/post', passport.authenticate('jwt', { session: false }), postRouter);
app.use('/api/comments', passport.authenticate('jwt', { session: false }), commentRouter);

const httpServer = createServer(app);
socket(httpServer);

httpServer.listen(5000, () => console.log('listening on port 5000'));