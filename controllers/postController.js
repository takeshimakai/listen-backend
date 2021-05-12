import expressValidator from 'express-validator';

import Post from '../models/post.js';

const { body, validationResult } = expressValidator;

const getPost = (req, res, next) => {
  res.send('get post');
};

const savePost = (req, res, next) => {
  res.send('save post');
};

const editPost = (req, res, next) => {
  res.send('update post');
};

const deletePost = (req, res, next) => {
  res.send('delete post');
};

export default {
  getPost,
  savePost,
  editPost,
  deletePost
};