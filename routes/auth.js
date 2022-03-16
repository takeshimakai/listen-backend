import '../config/passport.js';

import express from 'express';
import passport from 'passport';

import auth from '../controllers/auth.js';

const router = express.Router();

router.post('/signup', auth.signUp);

router.post('/signout', auth.signOut);

router.post('/resend-code', passport.authenticate('jwt', { session: false }), auth.resendVerificationCode);

router.post('/forgot-password', auth.forgotPassword);

router.post('/reset-password', auth.resetPassword);

router.post('/verify', passport.authenticate('jwt', { session: false }), auth.emailVerification);

router.post('/login', auth.login);

router.post('/renew-token', auth.renewToken);

router.get('/google', passport.authenticate('google', {
  scope: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ],
  session: false
}));

router.get('/google/redirect', passport.authenticate('google', { session: false }), auth.googleLogin);

router.post('/google/success', passport.authenticate('jwt', { session: false }), auth.googleSuccess);

export default router;