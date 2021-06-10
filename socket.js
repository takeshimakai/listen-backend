import { Server } from 'socket.io';

const socket = (server) => {
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('socket connected1!');
  });
};

export default socket;