import express from 'express';

import postController from '../controllers/postController.js';

const router = express.Router();

router.get('/', postController.getAllPosts);

router.post('/', postController.savePost);

router.put('/:postId', postController.editPost);

router.delete('/:postId', postController.deletePost);

export default router;