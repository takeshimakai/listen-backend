import expressValidator from 'express-validator';
import { v4 as uuidv4 } from 'uuid';

import generateJWT from '../utils/generateJWT.js';

import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

const { body, param, validationResult } = expressValidator;

const getProfile = async (req, res, next) => {
  try {
    if (req.user.id === req.params.userId) {
      const user = await User.findById(req.user.id, 'profile').lean();

      if (user.profile.problemTopics) {
        user.profile.problemTopics.sort((a, b) => {
          if (a === 'Other') return 1;
          if (b === 'Other') return -1;
          if (a < b) return -1;
          if (a > b) return 1;
        });
      }

      return res.status(200).json(user);
    }

    const user = await User.findById(req.params.userId, 'profile').lean();
    let filtered = {
      _id: user._id,
      profile: { username: user.profile.username, img: user.profile.img }
    };

    if (user.profile.public) {
      for (const key in user.profile) {
        if (user.profile.public.includes(key) && key !== 'public') {
          filtered.profile[key] = user.profile[key];
        }
      }
    }

    if (filtered.profile.problemTopics) {
      filtered.profile.problemTopics.sort((a, b) => {
        if (a === 'Other') return 1;
        if (b === 'Other') return -1;
        if (a < b) return -1;
        if (a > b) return 1;
      });
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

      const refreshToken = uuidv4();

      const data = {
        'profile.img': req.file
          ? {
              data: Buffer.from(req.file.buffer, 'base64'),
              contentType: req.file.mimetype
            }
          : undefined,
        'profile.username': req.body.username,
        'profile.dob': req.body.dob,
        'profile.gender': req.body.gender,
        'profile.interests': req.body.interests,
        'profile.problemTopics': req.body.problemTopics,
        'auth.refreshToken.token': refreshToken,
        'auth.refreshToken.exp': Math.floor(Date.now()/1000) + 43200
      };

      const user = await User.findByIdAndUpdate(
        req.user.id,
        data,
        {
          new: true,
          fields: 'profile.username auth.verification.verified'
        }
      );
  
      const token = generateJWT(user);
  
      return res.status(200).json({ token, refreshToken });
    } catch (err) {
      next(err);
    }
  }
];

const editProfile = async (req, res, next) => {
  try {
    let data = {
      'profile.dob': req.body.dob,
      'profile.gender': req.body.gender,
      'profile.interests': req.body.interests,
      'profile.problemTopics': req.body.problemTopics,
      'profile.public': req.body.public
    };

    if (req.file) {
      data = {
        ...data,
        'profile.img': {
          data: Buffer.from(req.file.buffer, 'base64'),
          contentType: req.file.mimetype
        }
      }
    }

    if (req.body.img === '') {
      data = { ...data, 'profile.img': undefined };
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      data,
      {
        new: true,
        fields: 'profile',
        lean: true
      }
    );

    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

const deleteUser = (req, res, next) => {  
  Promise.all([
    Post.updateMany({ postedBy: req.user.id }, { postedBy: undefined }),
    Comment.updateMany({ postedBy: req.user.id }, { postedBy: undefined }),
    User.findByIdAndDelete(req.user.id)
  ])
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