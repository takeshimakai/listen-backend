import expressValidator from 'express-validator';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import jwt from 'jsonwebtoken';

import User from '../models/user.js';

const { body, validationResult } = expressValidator;

const signUp = [
  body('email')
  .trim()
  .notEmpty()
  .withMessage('Email is required')
  .toLowerCase()
  .isEmail()
  .withMessage('Please enter a valid email')
  .custom(value => {
    return User.findOne({ email: value }).then(user => {
      if (user) {
        return Promise.reject('E-mail already in use');
      };
    });
  }),

  body('password')
  .notEmpty()
  .withMessage('Password is required')
  .custom(value => !/\s/.test(value))
  .withMessage('No spaces are allowed in the password'),

  body('passwordConfirmation')
  .custom((value, { req }) => value === req.body.password)
  .withMessage('Password confirmation does not match the password'),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        res.status(400).json({ errors });
      } else {
        const hashedPw = await bcrypt.hash(req.body.password, 10);
        
        const newUser = new User({
          email: req.body.email,
          password: hashedPw
        });
  
        await newUser.save();
  
        res.sendStatus(200);
      }
    } catch (err) {
      next(err);
    }
  }
];

const login = [
  body('email')
  .trim()
  .notEmpty()
  .withMessage('Email is required')
  .toLowerCase()
  .isEmail()
  .withMessage('Please enter a valid email'),

  body('password')
  .notEmpty()
  .withMessage('Password is required'),
  
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors });
    }

    passport.authenticate('login', { session: false }, async (err, user, info) => {
      try {
        if (err) {
          return next(err);
        }
  
        if (!user) {
          return res.status(401).json({ info });
        }
  
        const token = await jwt.sign({ id: user._id, username: user.profile.username }, process.env.JWT_SECRET);
  
        return res.status(200).json({ token });
      } catch (err) {
        return next(err);
      }
    })(req, res);
  }
];

export default { signUp, login };