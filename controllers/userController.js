import expressValidator from 'express-validator';

import User from '../models/user.js';

const { body, validationResult } = expressValidator;

const getProfile = (req, res, next) => {
  res.send('get profile');
};

const saveProfile = (req, res, next) => {
  res.send('save profile');
};

const editProfile = (req, res, next) => {
  res.send('update profile');
};

const deleteProfile = (req, res, next) => {
  res.send('delete profile');
};

export default {
  getProfile,
  saveProfile,
  editProfile,
  deleteProfile
};