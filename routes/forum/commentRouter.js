import express from 'express';

import comment from '../../controllers/forum/comment.js';

const router = express.Router();

router.get('/:postId', comment.getComments);

router.post('/:postId', comment.saveComment);

router.put('/:commentId', comment.saveComment);

router.delete('/:commentId', comment.deleteComment);

export default router;