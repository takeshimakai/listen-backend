import expressValidator from 'express-validator';

import User from '../models/user.js';

const { body, validationResult } = expressValidator;

const getCurrentUserProfile = async (req, res, next) => {
  try {
    const { profile } = await User.findById(req.params.userId, 'profile');

    return res.status(200).json(profile);
  } catch (err) {
    return next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId, 'profile').lean();

    if (user.profile.hidden) {
      const filtered = { _id: req.params.userId };
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

      const profile = new User({
        username: req.body.username,
        dob: req.body.dob,
        gender: req.body.gender,
        interests: req.body.interests,
        problemTopics: req.body.problemTopics,
        hidden: req.body.hidden
      });;

      if (req.body.formType === 'edit') {
        const updatedProfile = await User.findByIdAndUpdate(req.params.userId,
          { ...profile, _id: req.params.userId },
          { new: true });

        return res.status(200).json(updatedProfile);
      }

      await profile.save();

      return res.sendStatus(200);
    } catch (err) {
      return next(err);
    }
  }
];

export default {
  getCurrentUserProfile,
  getProfile,
  saveProfile
};