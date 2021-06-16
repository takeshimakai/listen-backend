import express from 'express';

import chatController from '../controllers/chatController.js';

const router = express.Router();

router.post('/', chatController.initializeChat);

router.post('/:roomId', chatController.terminateChat);

export default router;