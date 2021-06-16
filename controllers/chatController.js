import expressValidator from 'express-validator';

import User from '../models/user.js';
import Room from '../models/chat/room.js';

import usersAreAvailable from '../utils/usersAreAvailable.js';
import findMatch from '../utils/findMatch.js';

const initializeChat = async (req, res, next) => {
  try {
    // Start by checking for available users
    if (!usersAreAvailable()) {
      return res.status(200).json({ awaitConnection: false, message: 'Users are currently unavailable.' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, {
      chat: {
        isAvailable: true,
        filters: {
          age: {
            min: req.body.age.min,
            max: req.body.age.max
          },
          gender: req.body.gender,
          interests: req.body.interests,
          problemTopics: req.body.problemTopics
        }
      },
    }, { new: true, select: 'profile -profile.hidden' });

    // Make array of users that match criteria
    const match = await findMatch(user);

    if (!match) {
      const room = new Room();
      user.chat.room = room._id;
      await user.save();
      return res.status(200).json({
        room: room._id,
        awaitConnection: true,
        message: 'Users available but no match.'
      });
    }
    
    user.chat.room = match.chat.room;
    await user.save();

    return res.status(200).json({
      room: user.chat.room,
      awaitConnection: false,
      message: 'Match found. Room created.'
  });
  } catch (err) {
    next(err);
  }
};

const terminateChat = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      chat: {
        room: undefined,
        filters: {
          age: {
            min: undefined,
            max: undefined
          },
          gender: undefined,
          interests: undefined,
          problemTopics: undefined
        }
      }
    });

    await Room.findByIdAndDelete(req.params.roomId);

    return res.status(200).json({ message: 'Chat terminated.' });
  } catch (err) {
    next(err);
  }
};

export default {
  initializeChat,
  terminateChat
};