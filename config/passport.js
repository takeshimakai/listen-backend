import dotenv from 'dotenv';
import passport from 'passport';
import passportLocal from 'passport-local';
import passportJwt from 'passport-jwt';
import passportGoogle from 'passport-google-oauth';
import bcrypt from 'bcryptjs';

import User from '../models/user.js';

dotenv.config();

const localStrategy = passportLocal.Strategy;
const jwtStrategy = passportJwt.Strategy;
const { ExtractJwt } = passportJwt;
const googleStrategy = passportGoogle.OAuth2Strategy;

passport.use('login', new localStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
async (username, password, done) => {
  try {
    const user = await User.findOne({ 'auth.email': username });

    if (!user) {
      return done(null, false, { message: 'Incorrect email' });
    }

    const isValidPw = await bcrypt.compare(password, user.auth.password);

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

passport.use(new googleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/api/auth/google/redirect'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ 'auth.email': profile.emails[0].value });

    if (user && user.auth.googleId) {
      return done(null, user);
    }

    if (user && !user.auth.googleId) {
      user.auth.googleId = profile.id;
      user.auth.password = null;
      await user.save();
      return done(null, user);
    }

    user = new User({
      auth: {
        googleId: profile.id,
        email: profile.emails[0].value
      }
    });

    await user.save();

    return done(null, user);
  } catch (err) {
    done(err);
  }
}))