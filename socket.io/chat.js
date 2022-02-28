import Message from '../models/Message.js';
import User from '../models/User.js';
import Room from '../models/Room.js';

import findListener from '../utils/findListener.js';
import createFilters from '../utils/createFilters.js';

const cleanRoom = async (socket) => {
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
};

const reconnect = async (socket, roomID) => {
  const { users } = await Room.findById(roomID);

  socket.otherUserID = socket.userID === users[0] ? users[1] : users[0];
  socket.roomID = roomID;

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
};

const initializeListener = async (socket) => {
  await User.findByIdAndUpdate(socket.userID, { 'chat.isListener': true });
};

const initializeTalker = async (socket, filters) => {
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

  const [self, other] = await Promise.all([
    User
      .findByIdAndUpdate(socket.userID, { 'chat.isConnected': true })
      .select('profile')
      .lean(),
    User.findByIdAndUpdate(match._id, {
      'chat.isListener': false,
      'chat.isConnected': true
    }, { new: true })
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

  socket.emit('match found', { roomID: room._id, otherUser: listener });
  socket.to(socket.otherUserID).emit('match found', { roomID: room._id, otherUser: talker });
};

const listenerAbortMatch = async (socket) => {
  await User.findByIdAndUpdate(socket.userID, { 'chat.isListener': false });
};

const listenerSetUp = (socket, roomID, otherUserID) => {
  socket.roomID = roomID;
  socket.otherUserID = otherUserID;
};

const newMsg = (socket, msg) => {
  socket.to(socket.otherUserID).emit('new msg', msg);
  new Message({
    roomID: socket.roomID,
    msg,
    from: socket.userID
  }).save();
};

const disconnect = async (socket) => {
  console.log(`${socket.username} disconnected!`);
  await User.findByIdAndUpdate(socket.userID, {
    'chat.isListener': false,
    'chat.isConnected': false
  });
  socket.to(socket.otherUserID).emit('otherUser disconnected');
};

const leaveRoom = async (socket) => {
  await User.findByIdAndUpdate(socket.userID, {
    'chat.isListener': false,
    'chat.isConnected': false
  });
  socket.to(socket.otherUserID).emit('user left');
};

export default {
  cleanRoom,
  reconnect,
  initializeListener,
  initializeTalker,
  listenerAbortMatch,
  listenerSetUp,
  newMsg,
  disconnect,
  leaveRoom
};