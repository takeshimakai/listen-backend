import express from 'express';

import posts from '../controllers/posts.js';

const router = express.Router();

router.get('/', posts.getAllPosts);

router.get('/by-user', posts.getPostsByUser);

router.post('/', posts.savePost);

router.put('/:postId', posts.editPost);

router.delete('/:postId', posts.deletePost);

router.put('/:postId/relatability', posts.editRelatable);

export default router;