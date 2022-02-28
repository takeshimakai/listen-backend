import expressValidator from 'express-validator';

import Comment from '../models/Comment.js';

const { body, validationResult } = expressValidator;

const getComments = (req, res, next) => {
  Comment
  .find({ postId: req.params.postId })
  .populate('postedBy', 'profile.username')
  .then(comments => res.status(200).json(comments))
  .catch(err => next(err));
};

const getCommentsByUser = async (req, res, next) => {
  try {
    const comments = await Comment
      .find({ postedBy: req.user.id })
      .populate('postId', 'title');

    return res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
}

const saveComment = [
  body('content')
  .trim()
  .notEmpty()
  .withMessage('Comment is required.'),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json(errors);
      }

      const comment = new Comment({
        postId: req.params.postId,
        replyTo: req.body.replyTo,
        postedBy: req.user.id,
        content: req.body.content,
        datePosted: Date.now()
      });

      await comment.save()
      await comment.populate('postedBy', 'profile.username').execPopulate();

      return res.status(200).json(comment);
    } catch (err) {
      next(err);
    }
  }
];

const editComment = [
  body('content')
  .trim()
  .notEmpty()
  .withMessage('Comment is required.'),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json(errors);
      }

      const comment = await Comment.findById(req.params.commentId);

      if (comment.postedBy.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'You are not authorized to edit this comment' });
      }

      comment.content = req.body.content;
      comment.dateEdited = Date.now();

      await comment.save()
      await comment.populate('postedBy', 'profile.username').execPopulate();

      return res.status(200).json(comment);
    } catch (err) {
      next(err);
    }
  }
];

const deleteComment = async (req, res, next) => {
  try {
    let ids = [req.params.commentId];
    let parentIds = [req.params.commentId];

    while (parentIds.length > 0) {
      const found = await Comment.find({ replyTo: { $in: parentIds } }, '_id');
      const foundIds = [];
      found.forEach(({ _id }) => foundIds.push(_id));
      parentIds = foundIds;
      ids = [...ids, ...parentIds];
    }

    await Comment.deleteMany({ _id: { $in: ids } });

    return res.sendStatus(200);
  } catch (err) {
    next(err);
  }
};

const editRelatable = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    comment.relatable.includes(req.user.id)
      ? comment.relatable = comment.relatable.filter(id => id.toString() !== req.user.id)
      : comment.relatable.push(req.user.id);

    await comment.save();
    await comment.populate('postedBy', 'profile.username').execPopulate();

    return res.status(200).json(comment);
  } catch (err) {
    next(err);
  }
}

export default {
  getComments,
  getCommentsByUser,
  saveComment,
  editComment,
  deleteComment,
  editRelatable
};