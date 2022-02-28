import expressValidator from 'express-validator';

import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

const { body, validationResult } = expressValidator;

const getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().populate('postedBy', 'profile.username');
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};

const getPostsByUser = async (req, res, next) => {
  try {
    const posts = await Post.find({ postedBy: req.user.id });
    return res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
}

const savePost = [
  body('topics')
  .notEmpty()
  .withMessage('Please select topics.'),

  body('title')
  .trim()
  .notEmpty()
  .withMessage('Title is required.'),

  body('content')
  .trim()
  .notEmpty()
  .withMessage('Content is required.'),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json(errors);
      }
      
      const post = new Post({
        topics: req.body.topics,
        title: req.body.title,
        content: req.body.content,
        datePosted: Date.now(),
        postedBy: req.user.id
      });

      await post.save();
      await post.populate('postedBy', 'profile.username').execPopulate();

      return res.status(200).json(post);
    } catch (err) {
      next(err);
    }
  }
];

const editPost = [
  body('topics')
  .notEmpty()
  .withMessage('Please select topics'),

  body('title')
  .trim()
  .notEmpty()
  .withMessage('Title is required.'),

  body('content')
  .trim()
  .notEmpty()
  .withMessage('Content is required.'),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json(errors);
      }

      const post = await Post.findById(req.params.postId);

      if (post.postedBy.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'You are not authorized to edit this post'});
      }

      post.topics = req.body.topics;
      post.title = req.body.title;
      post.content = req.body.content;
      post.dateEdited = Date.now();

      await post.save();
      await post.populate('postedBy', 'profile.username').execPopulate();
      
      return res.status(200).json(post);
    } catch (err) {
      next(err);
    }
  }
]

const deletePost = (req, res, next) => {
  Promise.all([
    Post.findByIdAndDelete(req.params.postId),
    Comment.deleteMany({ postId: req.params.postId })
  ])
  .then(res.sendStatus(200))
  .catch(err => next(err));
};

const editRelatable = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);

    post.relatable.includes(req.user.id)
      ? post.relatable = post.relatable.filter(id => id.toString() !== req.user.id)
      : post.relatable.push(req.user.id);

    await post.save();
    await post.populate('postedBy', 'profile.username').execPopulate();

    return res.status(200).json(post);
  } catch (err) {
    next(err);
  }
}

export default {
  getAllPosts,
  getPostsByUser,
  savePost,
  editPost,
  deletePost,
  editRelatable
};