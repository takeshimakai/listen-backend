import User from '../models/user.js';

const getStatus = async (socket) => {
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
};

const send = async (socket) => {
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
};

const remove = async (io, socket) => {
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
};

const accept = async (io, socket) => {
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
};

const unfriend = async (io, socket) => {
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
};

export default {
  getStatus,
  send,
  remove,
  accept,
  unfriend
};