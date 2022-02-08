import User from '../models/user.js';

const getFriends = async (req, res, next) => {
  try {
    const friends = await User
      .findById(req.user.id, 'friends')
      .populate('friends.accepted', 'profile.username')
      .populate('friends.received', 'profile.username')
      .populate('friends.sent', 'profile.username');

    res.status(200).json(friends);
  } catch (err) {
    next(err);
  }
}

const getReceivedRequests = async (req, res, next) => {
  try {
    const requests = await User.findById(req.user.id, 'friends.received');
    res.status(200).json(requests);
  } catch (err) {
    next(err);
  }
}

const deleteFriend = async (req, res, next) => {
  try {
    await Promise.all([
      User.findByIdAndUpdate(
        req.user.id,
        { $pull: { 'friends.accepted': req.body.userId } }
      ),
      User.findByIdAndUpdate(
        req.body.userId,
        { $pull: { 'friends.accepted': req.user.id } }
      )
    ]);

    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
}

const acceptRequest = async (req, res, next) => {
  try {
    await Promise.all([
      User.findByIdAndUpdate(
        req.user.id,
        {
          $pull: { 'friends.received': req.body.userId },
          $push: { 'friends.accepted': req.body.userId }
        }
      ),
      User.findByIdAndUpdate(
        req.body.userId,
        {
          $pull: { 'friends.sent': req.user.id },
          $push: { 'friends.accepted': req.user.id }
        }
      )
    ])

    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
}

const sendRequest = async (req, res, next) => {
  try {
    await Promise.all([
      // Update recipient's received friend requests
      User.findByIdAndUpdate(
        req.body.userId,
        { $push: { 'friends.received': req.user.id } }
      ),
      // Update user's sent friend requests
      User.findByIdAndUpdate(
        req.user.id,
        { $push: { 'friends.sent': req.body.userId } }
      )
    ]);

    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
}

const deleteRequest = async (req, res, next) => {
  try {
    await Promise.all([
      User.findByIdAndUpdate(
        req.body.userId,
        {
          $pull: {
            'friends.received': req.user.id,
            'friends.sent': req.user.id
          }
        }
      ),
      User.findByIdAndUpdate(
        req.user.id,
        {
          $pull: {
            'friends.received': req.body.userId,
            'friends.sent': req.body.userId
          }
        }
      )
    ]);

    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
}

export default {
  getFriends,
  getReceivedRequests,
  deleteFriend,
  acceptRequest,
  sendRequest,
  deleteRequest
}