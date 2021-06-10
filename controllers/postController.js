import expressValidator from 'express-validator';

import Post from '../models/post.js';
import Comment from '../models/comment.js';

const { body, validationResult } = expressValidator;

// Get all posts
const getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().populate('postedBy', 'profile.username');
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
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
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json(errors);
      }

      let post;

      if (req.body.formType === 'edit') {
        post = {
          topics: req.body.topics,
          title: req.body.title,
          content: req.body.content,
          dateEdited: Date.now(),
        };

        const updated = await Post.findByIdAndUpdate(req.params.postId, post, { new: true });
        
        return res.status(200).json(updated);
      }
      
      post = new Post({
        topics: req.body.topics,
        title: req.body.title,
        content: req.body.content,
        datePosted: Date.now(),
        postedBy: req.body.postedBy
      });

      await post.save();

      return res.status(200).json(post);
    } catch (err) {
      next(err);
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
  deletePost
};