import express from 'express';

import post from '../../controllers/forum/post.js';

const router = express.Router();

router.get('/', post.getAllPosts);

router.post('/', post.savePost);

router.put('/:postId', post.editPost);

router.delete('/:postId', post.deletePost);

export default router;