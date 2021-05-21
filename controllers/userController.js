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
    const { profile } = await User.findById(req.params.userId, 'profile').lean();

    let filteredProfile;

    if (profile.hidden) {
      for (const key in profile) {
        if (!profile.hidden.includes(key) && key !== 'hidden') {
          filteredProfile = {
            ...filteredProfile,
            [key]: profile[key]
          }
        }
      }
    } else {
      filteredProfile = profile;
    }

    return res.status(200).json(filteredProfile);
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

const deleteProfile = (req, res, next) => {
  res.send('delete profile');
};

export default {
  getCurrentUserProfile,
  getProfile,
  saveProfile
};