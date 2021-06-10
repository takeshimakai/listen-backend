import expressValidator from 'express-validator';

import Comment from '../../models/forum/comment.js';

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
      }

      let comment;

      if (req.body.formType === 'edit') {
        comment = {
          content: req.body.content,
          dateEdited: Date.now()
        };

        const updated = Comment.findByIdAndUpdate(req.params.commentId, comment, { new: true });

        return res.status(200).json(updated);
      }

      comment = new Comment({
        postId: req.params.postId,
        postedBy: req.body.userId,
        content: req.body.content,
        datePosted: Date.now()
      });

      await comment.save();

      res.status(200).json(comment);
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
  deleteComment
};