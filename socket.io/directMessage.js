import DirectMsg from '../models/DirectMsg.js';
import Thread from '../models/Thread.js';

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

const send = async (socket, msg) => {
  let thread;

  if (msg.threadId) {
    thread = await Thread.findById(msg.threadId);

    if (thread.deleted.includes(msg.to)) {
      thread.deleted.splice(thread.indexOf(msg.to), 1);
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
};

export default {
  getAll,
  send,
  delThread,
  markAsRead
};