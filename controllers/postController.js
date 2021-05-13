import expressValidator from 'express-validator';

import Post from '../models/post.js';
import Comment from '../models/comment.js';

const { body, validationResult } = expressValidator;

// Get all posts
const getAllPosts = async (req, res, next) => {
  const posts = await Post.find().populate('postedBy', 'profile.username');
  res.status(200).json(posts);
};

// Save new post
const savePost = [
  body('title')
  .trim()
  .notEmpty()
  .withMessage('Title is required.')
  .escape(),

  body('content')
  .trim()
  .notEmpty()
  .withMessage('Content is required.')
  .escape(),

  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json(errors);
    } else {
      const post = new Post({
        topics: req.body.topics,
        title: req.body.title,
        content: req.body.content,
        postedBy: req.body.userId,
        datePosted: Date.now()
      });

      await post.save();

      res.sendStatus(200);
    }
  }
];

// Save edited post
const editPost = [
  body('title')
  .trim()
  .notEmpty()
  .withMessage('Title is required.')
  .escape(),

  body('content')
  .trim()
  .notEmpty()
  .withMessage('Content is required.')
  .escape(),

  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json(errors);
    } else {
      const post = new Post({
        _id: req.params.postId,
        topics: req.body.topics,
        title: req.body.title,
        content: req.body.content,
        dateEdited: Date.now(),
        postedBy: req.body.userId
      });

      const updatedPost = await Post.findByIdAndUpdate(req.params.postId, post, { new: true });

      res.status(200).json(updatedPost);
    }
  }
];

const deletePost = (req, res, next) => {
  Promise.all([
    Post.findByIdAndDelete(req.params.postId),
    Comment.deleteMany({ postId: req.params.postId })
  ])
  .then(res.sendStatus(200))
  .catch(err => next(err));
};

export default {
  getAllPosts,
  savePost,
  editPost,
  deletePost
};