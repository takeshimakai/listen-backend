import User from '../models/user.js';

const getFriends = async (socket, type) => {
  if (type === 'all') {
    const { friends } = await User
      .findById(socket.userID, 'friends')
      .populate('friends.accepted', 'profile.username')
      .populate('friends.received', 'profile.username')
      .populate('friends.sent', 'profile.username');
    
    return socket.emit('all friends', friends);
  }

  const { friends } = await User
    .findById(socket.userID, `friends.${type}`)
    .populate(`friends.${type}`, 'profile.username');

  socket.emit(`${type} friends`, friends[type]);
};

const send = async (socket, recipientID) => {
  await Promise.all([
    User.findByIdAndUpdate(
      recipientID,
      { $push: { 'friends.received': socket.userID } }
    ),
    User.findByIdAndUpdate(
      socket.userID,
      { $push: { 'friends.sent': recipientID } }
    )
  ]);

  socket.to(recipientID).emit('request received', { sentBy: socket.userID });
};

const decline = async (io, socket, recipientID) => {
  await Promise.all([
    User.findByIdAndUpdate(
      recipientID,
      { $pull: { 'friends.sent': socket.userID } }
    ),
    User.findByIdAndUpdate(
      socket.userID,
      { $pull: { 'friends.received': recipientID } }
    )
  ]);

  io.to([recipientID, socket.userID]).emit('request declined', { declinedBy: socket.userID });
};

const cancel = async (socket, recipientID) => {
  await Promise.all([
    User.findByIdAndUpdate(
      recipientID,
      { $pull: { 'friends.received': socket.userID } }
    ),
    User.findByIdAndUpdate(
      socket.userID,
      { $pull: { 'friends.sent': recipientID } }
    )
  ]);

  socket.to(recipientID).emit('request canceled', { canceledBy: socket.userID });
};

const accept = async (io, socket, recipientID) => {
  await Promise.all([
    User.findByIdAndUpdate(
      recipientID,
      {
        $pull: { 'friends.sent': socket.userID },
        $push: { 'friends.accepted': socket.userID }
      },
    ),
    User.findByIdAndUpdate(
      socket.userID,
      {
        $pull: { 'friends.received': recipientID },
        $push: { 'friends.accepted': recipientID }
      }
    )
  ]);

  io.to([recipientID, socket.userID]).emit('request accepted', { acceptedBy: socket.userID });
};

const unfriend = async (socket, recipientID) => {
  await Promise.all([
    User.findByIdAndUpdate(
      recipientID,
      { $pull: { 'friends.accepted': socket.userID } }
    ),
    User.findByIdAndUpdate(
      socket.userID,
      { $pull: { 'friends.accepted': recipientID } }
    )
  ]);

  socket.to(recipientID).emit('unfriended', { unfriendedBy: socket.userID });
};

const getFriendshipStatus = async (socket, otherUserID) => {
  const { friends } = await User.findById(socket.userID, 'friends');
  let friendshipStatus;

  if (friends.accepted.some(i => i._id.toString() === otherUserID)) {
    friendshipStatus = 'friends';
  }

  if (friends.received.some(i => i._id.toString() === otherUserID)) {
    friendshipStatus = 'received';
  }

  if (friends.sent.some(i => i._id.toString() === otherUserID)) {
    friendshipStatus = 'sent';
  }

  socket.emit('friendship status', friendshipStatus);
};

export default {
  getFriends,
  send,
  decline,
  cancel,
  accept,
  unfriend,
  getFriendshipStatus
}