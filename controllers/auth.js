import expressValidator from 'express-validator';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import jwt from 'jsonwebtoken';

import transporter from '../config/nodemailer.js';

import User from '../models/user.js';

import generateCode from '../utils/generateCode.js';

const { body, validationResult } = expressValidator;

const signUp = [
  body('email')
  .trim()
  .notEmpty()
  .withMessage('Email is required.')
  .toLowerCase()
  .isEmail()
  .withMessage('Please enter a valid email.')
  .custom(value => {
    return User
      .findOne({ 'auth.email': value })
      .then(user => {
        if (user) {
          return Promise.reject('E-mail already in use.');
      };
    });
  }),

  body('password')
  .notEmpty()
  .withMessage('Password is required.')
  .custom(value => !/\s/.test(value))
  .withMessage('No spaces are allowed in the password.'),

  body('passwordConfirmation')
  .custom((value, { req }) => value === req.body.password)
  .withMessage('Password confirmation does not match.'),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json(errors);
      }

      const hashedPw = await bcrypt.hash(req.body.password, 10);
      const randomCode = generateCode();
      
      const newUser = new User({
        auth: {
          email: req.body.email,
          password: hashedPw,
          verification: {
            code: randomCode
          }
        }
      });

      await newUser.save();

      const token = jwt.sign(
        { id: newUser._id, verified: newUser.auth.verification.verified },
        process.env.JWT_SECRET
      );

      await transporter.sendMail({
        from: '"Listen" <listen.app.test@gmail.com>',
        to: req.body.email,
        subject: `Your email verification code is ${randomCode}`,
        html: `<p>To complete your sign up process, enter the following code: <b>${randomCode}</b></p>`
      });

      return res.status(200).json(token);
    } catch (err) {
      next(err);
    }
  }
];

const resendVerificationCode = async (req, res, next) => {
  try {
    const code = generateCode();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 'auth.verification.code': code },
      { fields: 'auth.email' }
    );

    await transporter.sendMail({
      from: '"Listen" <listen.app.test@gmail.com>',
      to: user.auth.email,
      subject: `Your email verification code is ${code}`,
      html: `<p>To complete your sign up process, enter the following code: <b>${code}</b></p>`
    });

    res.status(200).json({ email: user.auth.email });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = [
  body('email')
  .trim()
  .toLowerCase()
  .isEmail()
  .withMessage('Please enter a valid email.'),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json(errors);
      }

      const user = await User.findOne({ 'auth.email': req.body.email });

      if (!user) {
        return res.status(404).json({ msg: 'The email is not registered.' });
      }

      const code = generateCode();

      user.auth.verification.code = code;
      await user.save();

      await transporter.sendMail({
        from: '"Listen" <listen.app.test@gmail.com>',
        to: req.body.email,
        subject: `Your email verification code is ${code}`,
        html: `<p>To reset your password, enter the following code: <b>${code}</b></p>`
      });

      return res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  }
];

const resetPassword = [
  body('code')
  .notEmpty()
  .withMessage('Please enter a verification code.')
  .custom((value, { req }) => {
    return User
      .findOne({ 'auth.email': req.body.email }, 'auth.verification.code')
      .then(user => {
        if (user.auth.verification.code !== value) {
          return Promise.reject('The code entered is incorrect.');
        }
      });
  }),

  body('password')
  .notEmpty()
  .withMessage('Password is required.')
  .custom(value => !/\s/.test(value))
  .withMessage('No spaces are allowed in the password.'),

  body('passwordConfirmation')
  .custom((value, { req }) => value === req.body.password)
  .withMessage('Password confirmation does not match.'),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json(errors);
      }

      const hashedPw = await bcrypt.hash(req.body.password, 10);

      const user = await User.findOneAndUpdate(
        { 'auth.email': req.body.email },
        {
          'auth.password': hashedPw,
          'auth.verification.code': undefined,
          'auth.verification.verified': true
        },
        {
          new: true,
          fields: 'auth.verification.verified profile.username',
          lean: true
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

const emailVerification = async (req, res, next) => {
  try {
    let user = await User.findById(req.user.id, 'auth.verification');
    const { code } = req.body;

    if (user.auth.verification.code !== code) {
      return res.status(400).json({ msg: 'The code entered is incorrect.' });
    }

    user.auth.verification.verified = true;
    user.auth.verification.code = undefined;

    await user.save();

    const token = jwt.sign(
      { id: user._id, verified: user.auth.verification.verified },
      process.env.JWT_SECRET
    );

    return res.status(200).json(token);
  } catch (err) {
    next(err);
  }
};

const login = [
  body('email')
  .trim()
  .toLowerCase()
  .isEmail()
  .withMessage('Please enter a valid email.'),

  body('password')
  .notEmpty()
  .withMessage('Password is required.'),
  
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }

    passport.authenticate('login', { session: false }, async (err, user, info) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(401).json(info);
      }

      if (user.auth.verification.verified && user.auth.verification.code) {
        user.auth.verification.code = undefined;
        await user.save();
      }

      const token = jwt.sign({
        id: user._id,
        username: user.profile.username,
        verified: user.auth.verification.verified
      }, process.env.JWT_SECRET);

      return res.status(200).json(token);
    })(req, res);
  }
];

const googleLogin = (req, res) => {
  res.redirect('http://localhost:3000/auth/google/success');
}

const googleSuccess = (req, res) => {
  const token = jwt.sign({
    id: req.user._id,
    username: req.user.profile.username,
    verified: req.user.auth.verification.verified
  }, process.env.JWT_SECRET);
  req.logout();
  res.status(200).json(token);
}

export default {
  signUp,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
  emailVerification,
  login,
  googleLogin,
  googleSuccess
};