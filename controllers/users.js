import expressValidator from 'express-validator';
import jwt from 'jsonwebtoken';

import User from '../models/user.js';

const { body, param, validationResult } = expressValidator;

const getProfile = async (req, res, next) => {
  try {
    if (req.user.id === req.params.userId) {
      const user = await User.findById(req.user.id, 'profile').lean();
      return res.status(200).json(user);
    }

    const user = await User.findById(req.params.userId, 'profile friends').lean();
    let filtered = {
      _id: user._id,
      profile: { username: user.profile.username },
      friendshipStatus: ''
    };

    if (user.profile.public) {
      for (const key in user.profile) {
        if (user.profile.public.includes(key) && key !== 'public') {
          filtered.profile[key] = user.profile[key];
        }
      }
    }

    if (user.friends.accepted.some(i => i._id.toString() === req.user.id)) {
      filtered.friendshipStatus = 'friends';
    }

    if (user.friends.received.some(i => i._id.toString() === req.user.id)) {
      filtered.friendshipStatus = 'sent';
    }

    if (user.friends.sent.some(i => i._id.toString() === req.user.id)) {
      filtered.friendshipStatus = 'received';
    }

    return res.status(200).json(filtered);
  } catch (err) {
    return next(err);
  }
};

const createProfile = [
  body('username')
  .custom(value => {
    return User
      .findOne({ 'profile.username': value })
      .then(user => {
        if (user) {
          return Promise.reject('Username is already in use.');
        }
      })
  }),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json(errors);
      }

      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          'profile.username': req.body.username,
          'profile.dob': req.body.dob,
          'profile.gender': req.body.gender,
          'profile.interests': req.body.interests,
          'profile.problemTopics': req.body.problemTopics
        },
        {
          new: true,
          fields: 'profile.username auth.verification.verified'
        }
      );
  
      const token = jwt.sign({
        id: user._id,
        username: user.profile.username,
        verified: user.auth.verification.verified
      }, process.env.JWT_SECRET);
  
      return res.status(200).json(token);
    } catch (err) {
      next(err);
    }
  }
];

const editProfile = async (req, res, next) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      {
        'profile.dob': req.body.dob,
        'profile.gender': req.body.gender,
        'profile.interests': req.body.interests,
        'profile.problemTopics': req.body.problemTopics,
        'profile.public': req.body.public
      },
      {
        new: true,
        fields: 'profile'
      }
    );

    return res.status(200).json(updated);
  } catch (err) {
    return next(err);
  }
};

const deleteUser = (req, res, next) => {
  User
  .findByIdAndDelete(req.user.id)
  .then(res.sendStatus(200))
  .catch(err => next(err));
};

const usernameValidation = [
  param('username')
  .notEmpty()
  .withMessage('Username is required.')
  .custom(value => !/\s/.test(value))
  .withMessage('No spaces allowed in the username.')
  .isAlphanumeric()
  .withMessage('Must contain only letters and numbers.')
  .custom(value => {
    return User
      .findOne({ 'profile.username': value })
      .then(user => {
        if (user) {
          return Promise.reject('Username is already in use.');
        }
      })
  }),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json(errors);
      }
  
      return res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  }
];

export default {
  getProfile,
  createProfile,
  editProfile,
  deleteUser,
  usernameValidation
};