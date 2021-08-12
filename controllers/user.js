import expressValidator from 'express-validator';

import User from '../models/user.js';

const { body, validationResult } = expressValidator;

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId, 'profile').lean();

    // Hide info if current user is fetching other user's profile
    if (req.user.id !== user._id && user.profile.hidden) {
      const filtered = { _id: user._id };
      for (const key in user.profile) {
        if (!user.profile.hidden.includes(key) && key !== 'hidden') {
          filtered.profile = {
            ...filtered.profile,
            [key]: user.profile[key]
          }
        }
      }
      return res.status(200).json(filtered);
    }

    return res.status(200).json(user);
  } catch (err) {
    return next(err);
  }
};

const saveProfile = [
  body('username')
  .notEmpty()
  .withMessage('Username is required')
  .custom(value => !/\s/.test(value))
  .withMessage('No spaces are allowed in the username')
  .escape(),

  body('interests')
  .trim()
  .escape()
  .customSanitizer(value => value.toLowerCase().split(',')),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json(errors);
      }

      const profile = {
          username: req.body.username,
          dob: req.body.dob,
          gender: req.body.gender,
          interests: req.body.interests,
          problemTopics: req.body.problemTopics,
          hidden: req.body.hidden
      };

      const updated = await User.findByIdAndUpdate(
        req.params.userId,
        { profile },
        { new: true }
      );

      return res.status(200).json(updated);
    } catch (err) {
      return next(err);
    }
  }
];

const deleteUser = (req, res, next) => {
  User
  .findByIdAndDelete(req.params.userId)
  .then(res.sendStatus(200))
  .catch(err => next(err));
};

export default {
  getProfile,
  saveProfile,
  deleteUser
};