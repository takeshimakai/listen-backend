import isCompatible from "./isCompatible.js";

const findTalker = async (user) => {
  try {
    const talkers = await User.find({
      _id: { $ne: user._id },
      'chat.isAvailable': true
    }, 'chat profile');
  
    const match = talkers.find(talker => isCompatible(user, talker));

    return match;
  } catch (err) {
    console.log(err);
  }
}

export default findTalker;