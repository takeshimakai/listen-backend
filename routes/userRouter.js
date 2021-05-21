import express from 'express';

import userController from '../controllers/userController.js';

const router = express.Router();

router.get('/current/:userId', userController.getCurrentUserProfile);

router.get('/:userId', userController.getProfile);

router.post('/', userController.saveProfile);

router.put('/:userId', userController.saveProfile);

router.delete('/:userId', userController.deleteUser);

export default router;