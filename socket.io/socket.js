import { Server } from 'socket.io';
import passport from 'passport';

import friends from './friends.js';
import chat from './chat.js';
import directMessage from './directMessage.js';

const socket = (server) => {
  const io = new Server(server, { cors: { origin: 'http://localhost:3000' } });

  const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

  io.use(wrap(passport.authenticate('jwt', { session: false })));

  io.use(async (socket, next) => {
    const { id, username } = socket.request.user;

    socket.userID = id;
    socket.username = username;

    next();
  });

  io.on('connection', (socket) => {
    console.log(`${socket.username} connected!`);

    socket.join(socket.userID);

    socket.on('reconnect', (roomID) => {
      chat.reconnect(socket, roomID);
    });

    socket.on('initialize', async ({ role, filters }) => {  
      chat.cleanRoom(socket);

      if (role === 'listen') {
        chat.initializeListener(socket);
      }

      if (role === 'talk') {
        chat.initializeTalker(socket, filters);
      }
    });

    socket.on('listener abort match', () => chat.listenerAbortMatch(socket));

    socket.on('listener setup', ({ roomID, otherUserID }) => chat.listenerSetUp(socket, roomID, otherUserID));

    socket.on('new msg', ({ msg }) => chat.newMsg(socket, msg));

    socket.on('disconnect', () => chat.disconnect(socket));

    socket.on('leave room', () => chat.leaveRoom(socket));

    socket.on('get friendship status', (otherUserID) => friends.getFriendshipStatus(socket, otherUserID));

    socket.on('get friends', (type) => friends.getFriends(socket, type));

    socket.on('send request', (recipientID) => friends.send(socket, recipientID));

    socket.on('decline request', (recipientID) => friends.decline(io, socket, recipientID));

    socket.on('cancel request', (recipientID) => friends.cancel(socket, recipientID));

    socket.on('accept request', (recipientID) => friends.accept(io, socket, recipientID));

    socket.on('unfriend', (recipientID) => friends.unfriend(socket, recipientID));

    socket.on('get dms', () => directMessage.getAll(socket));

    socket.on('get unread dm count', () => directMessage.getUnreadCount(socket));

    socket.on('send dm', (msg) => directMessage.send(socket, msg));

    socket.on('delete thread', (threadID) => directMessage.delThread(socket, threadID));

    socket.on('mark as read', (msgID) => directMessage.markAsRead(socket, msgID));
  });
};

export default socket;