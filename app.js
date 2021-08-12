import './config/passport.js';
import './config/mongoDB.js';

import express from 'express';
import passport from 'passport';
import cors from 'cors';
import { createServer } from 'http';

import socket from './socket.io/socket.js';

import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import postRouter from './routes/forum/post.js';
import commentRouter from './routes/forum/comment.js';
import chatRouter from './routes/chat.js';

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
app.use('/api/chat', passport.authenticate('jwt', { session: false }), chatRouter);

const httpServer = createServer(app);
socket(httpServer);

httpServer.listen(5000, () => console.log('listening on port 5000'));