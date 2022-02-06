import { Server } from 'socket.io';

import Message from '../models/chat/message.js';
import Room from '../models/chat/room.js';

import friendRequest from './friendRequest.js';
import chat from './chat.js';

const socket = (server) => {
  const io = new Server(server, { cors: { origin: 'http://localhost:3000' } });

  io.use(async (socket, next) => {
    const { userID, username, roomID } = socket.handshake.auth;

    socket.userID = userID;
    socket.username = username;

    if (roomID) {
      const { users } = await Room.findById(roomID);

      socket.otherUserID = userID === users[0] ? users[1] : users[0];
      socket.roomID = roomID;
    } else {
      const room = await Room.findOne({ users: socket.userID });

      if (room && room.users.length === 1) {
        await Promise.all([
          Message.deleteMany({ roomID: room._id }),
          Room.findByIdAndDelete(room._id)
        ]);
      }

      if (room && room.users.length === 2) {
        room.users.splice(room.users.indexOf(socket.userID), 1);
        await room.save();
      }
    }

    next();
  });

  io.on('connection', async (socket) => {
    console.log(`${socket.username} connected!`);

    socket.join(socket.userID);
      
    if (socket.roomID) {
      chat.reconnect(socket);
    }

    socket.on('initiate', ({ role, filters }) => {  
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

    socket.on('get friendship status', () => friendRequest.getStatus(socket));

    socket.on('send request', () => friendRequest.send(socket));

    socket.on('delete request', () => friendRequest.remove(io, socket));

    socket.on('accept request', () => friendRequest.accept(io, socket));

    socket.on('unfriend', () => friendRequest.unfriend(io, socket));
  });
};

export default socket;