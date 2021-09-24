import express from 'express';

import user from '../controllers/user.js';

const router = express.Router();

router.get('/:userId', user.getProfile);

router.put('/', user.saveProfile);

router.put('/username', user.saveUsername);

router.delete('/', user.deleteUser);

export default router;