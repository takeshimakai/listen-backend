import setYear from './setYear.js';

const createFilters = (user) => {
  const filters = {
    dob: {
      min: user.chat.filters.age.min ? setYear(user.chat.filters.age.min) : null,
      max: user.chat.filters.age.max ? setYear(user.chat.filters.age.max) : null
    },
    gender: user.chat.filters.gender ? user.chat.filters.gender : null,
    interests: user.chat.filters.interests ? user.profile.interests : null,
    problemTopics: user.chat.filters.problemTopics ? user.profile.problemTopics : null
  };

  return filters;
};

export default createFilters;