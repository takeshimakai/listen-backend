import express from 'express';

import chat from '../controllers/chat.js';

const router = express.Router();

router.post('/talk', chat.initializeTalker);

router.post('/listen', chat.changeListenerAvailability);

router.post('/:roomId', chat.leaveChat);

export default router;