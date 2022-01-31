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
      const { profile } = await User.findById(socket.otherUserID, 'profile').lean();
      const msgs = await Message.find({ roomID: socket.roomID });
      let otherUser = {
        userID: socket.otherUserID,
        username: profile.username,
        img: profile.img
      };

      if (profile.public) {
        for (const key in profile) {
          if (profile.public.includes(key) && key !== 'public') {
            otherUser[key] = profile[key];
          }
        }
      }

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
          const { profile } = await User.findById(socket.userID, 'profile').lean();
          
          let talker = {
            userID: socket.userID,
            username: socket.username,
            img: profile.img
          };

          if (profile.public) {
            for (const key in profile) {
              if (profile.public.includes(key) && key !== 'public') {
                talker[key] = profile[key];
              }
            }
          }

          let listener = {
            userID: match._id.toString(),
            img: match.profile.img,
            username: match.profile.username
          };
      
          if (match.profile.public) {
            for (const key in match.profile) {
              if (match.profile.public.includes(key) && key !== 'public') {
                listener[key] = match.profile[key];
              }
            }
          }
          
          const room = new Room({ users: [socket.userID, listener.userID] });
          await room.save();

          socket.roomID = room._id;
          socket.otherUserID = listener.userID;

          io.to([socket.otherUserID, socket.userID]).emit('match found', {
            roomID: room._id,
            listener,
            talker
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

    socket.on('get friendship status', async () => {
      const { friends } = await User.findById(socket.userID, 'friends');
      let friendshipStatus;

      if (friends.accepted.some(i => i._id.toString() === socket.otherUserID)) {
        friendshipStatus = 'friends';
      }
  
      if (friends.received.some(i => i._id.toString() === socket.otherUserID)) {
        friendshipStatus = 'received';
      }
  
      if (friends.sent.some(i => i._id.toString() === socket.otherUserID)) {
        friendshipStatus = 'sent';
      }

      socket.emit('friendship status', { friendshipStatus });
    });

    socket.on('send request', async () => {
      await Promise.all([
        User.findByIdAndUpdate(
          socket.otherUserID,
          { $push: { 'friends.received': socket.userID } }
        ),
        User.findByIdAndUpdate(
          socket.userID,
          { $push: { 'friends.sent': socket.otherUserID } }
        )
      ]);

      socket.emit('friendship status', { friendshipStatus: 'sent' });
      socket.to(socket.otherUserID).emit('friendship status', { friendshipStatus: 'received' });
    });

    socket.on('delete request', async () => {
      await Promise.all([
        User.findByIdAndUpdate(
          socket.otherUserID,
          {
            $pull: {
              'friends.received': socket.userID,
              'friends.sent': socket.userID
            }
          }
        ),
        User.findByIdAndUpdate(
          socket.userID,
          {
            $pull: {
              'friends.received': socket.otherUserID,
              'friends.sent': socket.otherUserID
            }
          }
        )
      ]);

      io.to([socket.otherUserID, socket.userID]).emit('friendship status', { friendshipStatus: '' });
    });

    socket.on('accept request', async () => {
      await Promise.all([
        User.findByIdAndUpdate(
          socket.userID,
          {
            $pull: { 'friends.received': socket.otherUserID },
            $push: { 'friends.accepted': socket.otherUserID }
          }
        ),
        User.findByIdAndUpdate(
          socket.otherUserID,
          {
            $pull: { 'friends.sent': socket.userID },
            $push: { 'friends.accepted': socket.userID }
          }
        )
      ]);

      io.to([socket.otherUserID, socket.userID]).emit('friendship status', { friendshipStatus: 'friends' });
    });

    socket.on('unfriend', async () => {
      await Promise.all([
        User.findByIdAndUpdate(
          socket.userID,
          { $pull: { 'friends.accepted': socket.otherUserID } }
        ),
        User.findByIdAndUpdate(
          socket.otherUserID,
          { $pull: { 'friends.accepted': socket.userID } }
        )
      ]);

      io.to([socket.otherUserID, socket.userID]).emit('friendship status', { friendshipStatus: '' });
    });
  });
};

export default socket;