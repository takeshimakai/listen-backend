import express from 'express';

import friends from '../controllers/friends.js';

const router = express.Router();

router.get('/', friends.getFriends);

router.delete('/', friends.deleteFriend);

router.get('/received', friends.getReceivedRequests);

router.post('/requests', friends.sendRequest);

router.put('/requests', friends.acceptRequest);

router.delete('/requests', friends.deleteRequest);

export default router;