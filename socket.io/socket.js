import { Server } from 'socket.io';

import Message from '../models/chat/message.js';
import User from '../models/user.js';
import Room from '../models/chat/room.js';

import findListener from '../utils/findListener.js';
import createFilters from '../utils/createFilters.js';

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
      const { profile } = await User.findById(socket.otherUserID, 'profile.username profile.img').lean();
      const msgs = await Message.find({ roomID: socket.roomID });
      const otherUser = {
        userID: socket.otherUserID,
        username: profile.username,
        img: profile.img
      };
      socket.emit('reconnect', { msgs, otherUser });
      socket.to(socket.otherUserID).emit('otherUser reconnected');
    }

    socket.on('initiate', async ({ role, filters }) => {  
      if (role === 'listen') {
        await User.findByIdAndUpdate(socket.userID, { 'chat.isListener': true });
      }

      if (role === 'talk') {
        let numOfTries = 0;
        let match;
    
        while (numOfTries < 4 && !match) {
          numOfTries++;
          match = await findListener(socket.userID, createFilters(filters));
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        if (match) {
          const { profile } = await User.findById(socket.userID, 'profile.img').lean();
          const listener = {
            userID: match._id.toString(),
            username: match.profile.username,
            img: match.profile.img
          };
          
          const room = new Room({ users: [socket.userID, listener.userID] });
          await room.save();

          socket.roomID = room._id;
          socket.otherUserID = listener.userID;

          io.to([socket.otherUserID, socket.userID]).emit('match found', {
            roomID: room._id,
            listener,
            talker: {
              userID: socket.userID,
              username: socket.username,
              img: profile.img
            }
          });
        }
      }
    });

    socket.on('listener setup', async ({ roomID, talker }) => {
      await User.findByIdAndUpdate(socket.userID, { 'chat.isListener': false });
      socket.roomID = roomID;
      socket.otherUserID = talker.userID;
    });

    socket.on('new msg', ({ msg }) => {
      socket.to(socket.otherUserID).emit('new msg', msg);
      new Message({
        roomID: socket.roomID,
        msg,
        from: socket.userID
      }).save();
    });

    socket.on('disconnect', async () => {
      console.log(`${socket.username} disconnected!`);
      await User.findByIdAndUpdate(socket.userID, { 'chat.isListener': false });
      socket.to(socket.otherUserID).emit('otherUser disconnected');
    });
  });
};

export default socket;