import { Server } from 'socket.io';

import Message from '../models/chat/message.js';

const socket = (server) => {
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('socket connected!');

    socket.on('connect', (user) => {
      socket.join(user.id);
      console.log(`Joined ${user.id}`);
    });

    socket.on('initialize chat', (user, room, match) => {
      socket.join(room._id.toString());
      socket.to(match.id).emit('match found', (user, room));
    });

    socket.on('join room', (room) => {
      socket.join(room._id.toString());
      console.log(`Joined ${room._id}`);
    });

    socket.on('get messages', async (room) => {
      try {
        const messages = await Message.find({ room: room._id }, 'msg sentBy');

        socket.emit('retrieved messages', messages);
      } catch (err) {
        console.log(err);
      }
    });

    socket.on('new message', async (room, message) => {
      try {
        const msg = new Message({
          room: room._id,
          msg: message.msg,
          sentBy: message.sentBy
        });

        await msg.save();

        io.to(room._id.toString()).emit('new message', msg);
      } catch (err) {
        console.log(err);
      }
    });

    socket.on('disconnect', () => console.log('user disconnected'));
  });
};

export default socket;