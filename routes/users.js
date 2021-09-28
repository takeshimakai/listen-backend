import express from 'express';

import users from '../controllers/users.js';

const router = express.Router();

router.get('/:userId', users.getProfile);

router.put('/', users.saveProfile);

router.put('/username', users.saveUsername);

router.delete('/', users.deleteUser);

export default router;