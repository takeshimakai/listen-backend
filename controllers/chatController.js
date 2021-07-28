import expressValidator from 'express-validator';

import User from '../models/user.js';
import Room from '../models/chat/room.js';

import findListener from '../utils/findListener.js';
import createFilters from '../utils/createFilters.js';

const initializeTalker = async (req, res, next) => {
  try {
    const filters = createFilters(req.body);
    let match = await findListener(req.user.id, filters);

    let numOfTries = 0;
    let room;

    while (numOfTries < 10 && !match) {
      numOfTries++;
      await new Promise((resolve) => setTimeout(resolve, 5000));
      match = await findListener(req.user.id, filters);
    }

    if (match) {
      room = new Room({ users: [req.user.id, match._id] });
      await room.save();
    }

    return res.status(200).json({
      match: {
        id: match._id,
        username: match.username
      },
      room
    });
  } catch (err) {
    next(err);
  }
}

const changeListenerAvailability = (req, res, next) => {
  User
  .findById(req.user.id)
  .then(user => {
    user.chat.isListener ? user.chat.isListener = false : user.chat.isListener = true;
    user.save();
  })
  .then(res.sendStatus(200))
  .catch(err => next(err));
}

const leaveChat = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { 'chat.isListener': false });

    const room = await Room.findByIdAndUpdate(req.params.roomId, { $pull: { users: req.user.id } }, { new: true });

    if (room.users.length < 2) {
      await Room.findByIdAndDelete(req.params.roomId);
    }

    return res.sendStatus(200);
  } catch (err) {
    next(err);
  }
};

export default {
  initializeTalker,
  changeListenerAvailability,
  leaveChat
};