import express from 'express';

import userController from '../controllers/userController.js';

const router = express.Router();

router.get('/:userId', userController.getProfile);

router.put('/:userId', userController.saveProfile);

router.delete('/:userId', userController.deleteUser);

export default router;