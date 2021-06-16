import User from '../models/user.js';

import createFilters from './createFilters.js';
import isCompatible from './isCompatible.js';

const findMatch = async (user) => {
  try {
    const filters = createFilters(user);

    const foundUsers = await User.find({
      _id: { $ne: user._id },
      'chat.isAvailable': true,
      profile: {
        dob: { $lte: filters.dob.min, $gte: filters.dob.max },
        gender: filters.gender,
        interests: { $all: filters.interests },
        problemTopics: { $all: filters.problemTopics }
      }
    }, 'chat profile -profile.hidden');

    const match = foundUsers.find(foundUser => isCompatible(user, foundUser));

    return match;
  } catch (err) {
    console.log(err);
  }
};

export default findMatch;