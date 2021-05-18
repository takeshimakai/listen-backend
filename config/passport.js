import dotenv from 'dotenv';
import passport from 'passport';
import passportLocal from 'passport-local';
import passportJwt from 'passport-jwt';
import bcrypt from 'bcryptjs';

import User from '../models/user.js';

dotenv.config();

const localStrategy = passportLocal.Strategy;
const jwtStrategy = passportJwt.Strategy;
const { ExtractJwt } = passportJwt;

passport.use('login', new localStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
async (username, password, done) => {
  try {
    const user = await User.findOne({ email: username });

    if (!user) {
      return done(null, false, { message: 'Incorrect email' });
    }

    const isValidPw = await bcrypt.compare(password, user.password);

    if (!isValidPw) {
      return done(null, false, { message: 'Incorrect password' });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.use(new jwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
}, (payload, done) => done(null, payload)));