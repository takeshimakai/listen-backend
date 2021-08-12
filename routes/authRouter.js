import express from 'express';
import auth from '../controllers/auth.js';

const router = express.Router();

router.post('/signup', auth.signUp);

router.post('/login', auth.login);

export default router;