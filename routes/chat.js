import express from 'express';

import chat from '../controllers/chat.js';

const router = express.Router();

router.post('/talk', chat.initializeTalker);

router.put('/listen', chat.changeListenerAvailability);

router.post('/:roomId', chat.leaveChat);

export default router;