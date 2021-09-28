import express from 'express';

import comments from '../../controllers/forum/comments.js';

const router = express.Router();

router.get('/:postId', comments.getComments);

router.post('/:postId', comments.saveComment);

router.put('/:commentId', comments.editComment);

router.delete('/:commentId', comments.deleteComment);

export default router;