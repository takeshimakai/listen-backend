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
      const [other] = await Promise.all([
        User.findById(socket.otherUserID, 'profile chat').lean(),
        User.findByIdAndUpdate(socket.userID, { 'chat.isConnected': true })
      ]);
      const msgs = await Message.find({ roomID: socket.roomID });
      
      let otherUser = {
        userID: socket.otherUserID,
        username: other.profile.username,
        img: other.profile.img,
        isConnected: other.chat.isConnected
      };

      if (other.profile.public) {
        for (const key in other.profile) {
          if (other.profile.public.includes(key) && key !== 'public') {
            otherUser[key] = other.profile[key];
          }
        }
      }

      socket.emit('reconnect', { msgs, otherUser });
      socket.to(socket.otherUserID).emit('otherUser reconnected');
    }

    socket.on('initiate', async ({ role, filters }) => {  
      if (role === 'listen') {
        await User.findByIdAndUpdate(socket.userID, {
          'chat.isListener': true,
          'chat.isConnected': true
        });
      }

      if (role === 'talk') {
        let match;

        for (let i = 0; i < 5 && !match; i++) {
          match = await findListener(socket.userID, createFilters(filters));
          
          if (match) {
            break;
          }
          
          if (i === 4) {
            return socket.emit('no match');
          }

          await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        if (match) {
          const [self, other] = await Promise.all([
            User
              .findByIdAndUpdate(socket.userID, { 'chat.isConnected': true })
              .select('profile')
              .lean(),
            User.findByIdAndUpdate(match._id, { 'chat.isListener': false })
              .select('chat')
              .lean()
          ]);
          
          let talker = {
            userID: socket.userID,
            username: socket.username,
            img: self.profile.img,
            isConnected: true
          };

          if (self.profile.public) {
            for (const key in self.profile) {
              if (self.profile.public.includes(key) && key !== 'public') {
                talker[key] = self.profile[key];
              }
            }
          }

          let listener = {
            userID: match._id.toString(),
            img: match.profile.img,
            username: match.profile.username,
            isConnected: other.chat.isConnected
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

    socket.on('listener setup', ({ roomID, talker }) => {
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
      await User.findByIdAndUpdate(socket.userID, {
        'chat.isListener': false,
        'chat.isConnected': false
      });
      socket.to(socket.otherUserID).emit('otherUser disconnected');
    });

    socket.on('leave room', () => {
      socket.to(socket.otherUserID).emit('user left');
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