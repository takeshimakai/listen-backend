import express from 'express';

import postController from '../controllers/postController.js';

const router = express.Router();

router.post('/', postController.savePost);

router.get('/:id', postController.getPost);

router.put('/:id', postController.editPost);

router.delete('/:id', postController.deletePost);

export default router;