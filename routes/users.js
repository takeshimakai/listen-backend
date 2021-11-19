import express from 'express';

import users from '../controllers/users.js';

const router = express.Router();

router.get('/:userId', users.getProfile);

router.post('/', users.createProfile);

router.put('/', users.editProfile);

router.delete('/', users.deleteUser);

export default router;