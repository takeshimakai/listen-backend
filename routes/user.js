import express from 'express';

import user from '../controllers/user.js';

const router = express.Router();

router.get('/:userId', user.getProfile);

router.put('/:userId', user.saveProfile);

router.delete('/:userId', user.deleteUser);

export default router;