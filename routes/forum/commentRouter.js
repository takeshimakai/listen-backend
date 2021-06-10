import express from 'express';

import commentController from '../../controllers/forum/commentController.js';

const router = express.Router();

router.get('/:postId', commentController.getComments);

router.post('/:postId', commentController.saveComment);

router.put('/:commentId', commentController.saveComment);

router.delete('/:commentId', commentController.deleteComment);

export default router;