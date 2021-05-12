import expressValidator from 'express-validator';

import User from '../models/user.js';

const { body, validationResult } = expressValidator;

const signUp = (req, res, next) => {
  res.send('sign up');
};

const login = (req, res, next) => {
  res.send('login');
};

export default { signUp, login };