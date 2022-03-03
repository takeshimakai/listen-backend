import DirectMsg from '../models/DirectMsg.js';
import Thread from '../models/Thread.js';
import User from '../models/User.js';

const getAll = async (socket) => {
  const threads = await Thread
    .find({
      users: { $in: [socket.userID] },
      deleted: { $ne: socket.userID }
    }, '-deleted')
    .populate({
      path: 'msgs',
      populate: {
        path: 'from',
        select: 'profile.username'
      }
    });

  threads.length > 0 && socket.emit('all dms', threads);
};

const getUnreadCount = async (socket) => {
  const threads = await Thread
  .find({
    users: { $in: [socket.userID] },
    deleted: { $ne: socket.userID }
  }, 'msgs')
  .populate({
    path: 'msgs',
    select: 'read'
  });

  let count = 0;

  threads.forEach(thread => {
    thread.msgs.forEach(msg => {
      if (!msg.read.includes(socket.userID)) {
        count++;
      }
    })
  });

  socket.emit('unread dm count', count);
};

const send = async (socket, msg) => {
  let errors = {};

  const { friends } = await User.findById(socket.userID, 'friends.accepted');

  if (!msg.to || !friends.accepted.includes(msg.to)) {
    errors.to = 'The recipient must be on your friends list.';
  }

  if (!msg.body) {
    errors.body = 'A message is required.';
  }

  if (Object.keys(errors).length > 0) {
    return socket.emit('dm error', errors);
  }

  let thread;

  if (msg.threadId) {
    thread = await Thread.findById(msg.threadId);

    if (thread.deleted.includes(msg.to)) {
      thread.deleted.splice(thread.deleted.indexOf(msg.to), 1);
    }
  } else {
    thread = new Thread({
      users: [socket.userID, msg.to],
      subject: msg.subject
    });
  }

  const newMsg = new DirectMsg({
    threadId: thread._id,
    from: socket.userID,
    body: msg.body,
    read: [socket.userID]
  });

  await newMsg.save();

  thread.lastUpdated = Date.now();
  thread.msgs.push(newMsg._id);
  await thread.save();

  await thread
    .populate({
      path: 'msgs',
      populate: {
        path: 'from',
        select: 'profile.username'
      }
    })
    .execPopulate();

  const filtered = {
    _id: thread._id,
    subject: thread.subject,
    lastUpdated: thread.lastUpdated,
    msgs: thread.msgs,
    users: thread.users
  };

  socket.to(msg.to).emit('new dm', filtered);
  socket.emit('dm success', filtered);
};

const delThread = async (socket, threadID) => {
  const thread = await Thread.findById(threadID);

  if (thread.deleted.length > 0) {
    await Promise.all([
      DirectMsg.deleteMany({ threadId: threadID }),
      Thread.findByIdAndDelete(threadID)
    ]);
  } else {
    thread.deleted.push(socket.userID);
    await thread.save();
  }
};

const markAsRead = async (socket, msgID) => {
  await DirectMsg.findByIdAndUpdate(msgID, { $push: { read: socket.userID } });

  socket.emit('marked as read');
};

export default {
  getAll,
  getUnreadCount,
  send,
  delThread,
  markAsRead
};