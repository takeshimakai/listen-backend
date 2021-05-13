import expressValidator from 'express-validator';

import Comment from '../models/comment.js';

const { body, validationResult } = expressValidator;

// Get all comments relating to specified post
const getComments = (req, res, next) => {
  Comment
  .find({ postId: req.params.postId })
  .populate('userId', 'profile.username')
  .then(comments => res.status(200).json(comments))
  .catch(err => next(err));
};

// Save new comment
const saveComment = [
  body('content')
  .trim()
  .notEmpty()
  .withMessage('Comment is required.')
  .escape(),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        res.status(400).json(errors);
      } else {
        const comment = new Comment({
          postId: req.params.postId,
          postedBy: req.body.userId,
          content: req.body.content,
          datePosted: Date.now()
        });

        await comment.save();

        res.sendStatus(200);
      }
    } catch (err) {
      next(err);
    }
  }
];


// Save edited comment
const editComment = [
  body('content')
  .trim()
  .notEmpty()
  .withMessage('Comment is required.')
  .escape(),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        res.status(400).json(errors);
      } else {
        const comment = new Comment({
          _id: req.params.commentId,
          postId: req.params.postId,
          postedBy: req.body.userId,
          content: req.body.content,
          dateEdited: Date.now()
        });

        const updatedComment = await Comment.findByIdAndUpdate(req.params.commentId, comment, { new: true });

        res.status(200).json(updatedComment);
      }
    } catch (err) {
      next(err);
    }
  }
];

// Delete comment by ID
const deleteComment = (req, res, next) => {
  Comment
  .deleteOne({ _id: req.params.commentId })
  .then(res.sendStatus(200))
  .catch(err => next(err));
};

export default {
  getComments,
  saveComment,
  editComment,
  deleteComment
};