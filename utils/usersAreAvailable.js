import User from '../models/User.js';

const usersAreAvailable = (user) => {
  User
  .findOne({ _id: { $ne: user._id }, 'chat.listen': true })
  .then(user => user ? true : false)
  .catch(err => console.log(err));
};

export default usersAreAvailable;