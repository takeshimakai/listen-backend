import express from 'express';

import userController from '../controllers/userController.js';

const router = express.Router();

router.get('/:id', userController.getProfile);

router.post('/:id', userController.saveProfile);

router.put('/:id', userController.editProfile);

router.delete('/:id', userController.deleteProfile);

export default router;