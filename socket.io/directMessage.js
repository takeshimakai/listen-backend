import ParentDM from '../models/ParentDM.js';
import ChildDM from '../models/ChildDM.js';

const getAll = async (socket) => {
  const msgs = await ParentDM
    .find({ to: socket.userID, from: socket.userID, deleted: { $ne: socket.userID } })
    .populate('from', 'profile.username')
    .populate('to', 'profile.username');

  msgs.forEach(async (msg) => {
    const replies = await ChildDM
      .find({ parentId: msg._id })
      .populate('from', 'profile.username')
      .populate('to', 'profile.username');

    msg.replies = replies;
  });

  socket.emit('all dms', msgs);
};

const send = (socket, msg) => {
  if (msg.new) {
    new ParentDM({
      from: socket.userID,
      to: msg.to,
      title: msg.title,
      body: msg.body,
      read: [socket.userID]
    }).save();
  } else {
    new ChildDM({
      parentId: msg.parentId,
      replyTo: msg.replyTo,
      from: socket.userID,
      to: msg.to,
      body: msg.body,
      read: [socket.userID]
    }).save();
  }

  socket.to(msg.to).emit('new dm');
};

const delMsg = async (socket, msgID) => {
  const dm = await ParentDM.findById(msgID);

  if (dm.deleted.length > 0) {
    await Promise.all([
      ParentDM.findByIdAndDelete(msgID),
      ChildDM.deleteMany({ parentId: msgID })
    ]);
  } else {
    dm.deleted.push(socket.userID);
    await dm.save();
  }
};

const markAsRead = (socket, msg) => {
  if (msg.isParent) {
    ParentDM.findByIdAndUpdate(msg._id, { $push: { read: socket.userID } });
  } else {
    ChildDM.findByIdAndUpdate(msg._id, { $push: { read: socket.userID } });
  }
};

export default {
  getAll,
  send,
  delMsg,
  markAsRead
};