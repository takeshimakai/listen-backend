import expressValidator from 'express-validator';

import Comment from '../models/comment.js';

const { body, validationResult } = expressValidator;

const getComments = (req, res, next) => {
  res.send('get comments');
};

const saveComment = (req, res, next) => {
  res.send('save comment');
};

const editComment = (req, res, next) => {
  res.send('edit comment');
};

const deleteComment = (req, res, next) => {
  res.send('delete comment');
};

export default {
  getComments,
  saveComment,
  editComment,
  deleteComment
};