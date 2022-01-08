import express from 'express';
import multer from 'multer';

import users from '../controllers/users.js';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.get('/username/:username', users.usernameValidation);

router.get('/:userId', users.getProfile);

router.post('/', upload.single('img'), users.createProfile);

router.put('/', upload.single('img'), users.editProfile);

router.delete('/', users.deleteUser);

export default router;