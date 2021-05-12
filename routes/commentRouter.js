import express from 'express';

import commentController from '../controllers/commentController.js';

const router = express.Router();

router.get('/:postId', commentController.getComments);

router.post('/:postId', commentController.saveComment);

router.put('/:commentId', commentController.editComment);

router.delete('/:commendId', commentController.deleteComment);

export default router;