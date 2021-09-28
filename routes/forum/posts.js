import express from 'express';

import posts from '../../controllers/forum/posts.js';

const router = express.Router();

router.get('/', posts.getAllPosts);

router.post('/', posts.savePost);

router.put('/:postId', posts.editPost);

router.delete('/:postId', posts.deletePost);

export default router;