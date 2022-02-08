import { Server } from 'socket.io';

import friends from './friends.js';
import chat from './chat.js';
import directMessage from './directMessage.js';

const socket = (server) => {
  const io = new Server(server, { cors: { origin: 'http://localhost:3000' } });

  io.use(async (socket, next) => {
    const { userID, username } = socket.handshake.auth;

    socket.userID = userID;
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
        chat.initializeTalker(io, socket, filters);
      }
    });

    socket.on('listener setup', ({ roomID, talker }) => chat.listenerSetUp(socket, roomID, talker));

    socket.on('new msg', ({ msg }) => chat.newMsg(socket, msg));

    socket.on('disconnect', () => chat.disconnect(socket));

    socket.on('leave room', () => chat.leaveRoom(socket));

    socket.on('get friendship status', () => friends.getFriendshipStatus(socket));

    socket.on('send request', (recipientID) => friends.send(socket, recipientID));

    socket.on('decline request', (recipientID) => friends.decline(io, socket, recipientID));

    socket.on('cancel request', (recipientID) => friends.cancel(socket, recipientID));

    socket.on('accept request', (recipientID) => friends.accept(io, socket, recipientID));

    socket.on('unfriend', (recipientID) => friends.unfriend(socket, recipientID));

    socket.on('get dms', () => directMessage.getAll(socket));

    socket.on('send dm', (msg) => directMessage.send(socket, msg));

    socket.on('delete dm', (msgID) => directMessage.delMsg(socket, msgID));

    socket.on('mark as read', (msg) => directMessage.markAsRead(socket, msg));
  });
};

export default socket;