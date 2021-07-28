import express from 'express';

import chatController from '../controllers/chatController.js';

const router = express.Router();

router.post('/talk', chatController.initializeTalker);

router.post('/listen', chatController.changeListenerAvailability);

router.post('/:roomId', chatController.leaveChat);

export default router;