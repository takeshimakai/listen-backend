import express from 'express';

import users from '../controllers/users.js';
import handleImgUpload from '../middleware/handleImgUpload.js';

const router = express.Router();

router.get('/username/:username', users.usernameValidation);

router.get('/:userId', users.getProfile);

router.post('/', handleImgUpload, users.createProfile);

router.put('/', handleImgUpload, users.editProfile);

router.delete('/', users.deleteUser);

export default router;