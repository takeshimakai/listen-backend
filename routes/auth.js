import '../config/passport.js';

import express from 'express';
import passport from 'passport';

import auth from '../controllers/auth.js';

const router = express.Router();

router.post('/signup', auth.signUp);

router.post('/login', auth.login);

router.get('/google', passport.authenticate('google', {
  scope: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ],
}));

router.get('/google/redirect', passport.authenticate('google'), auth.googleLogin);

router.get('/google/success', auth.googleSuccess);

export default router;