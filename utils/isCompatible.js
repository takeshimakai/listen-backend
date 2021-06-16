import createFilters from './createFilters.js';

const isCompatible = (user, foundUser) => {
  const filters = createFilters(foundUser);

  if (
    (filters.dob.min === null || user.profile.dob <= filters.dob.min)
    && (filters.dob.max === null || user.profile.dob >= filters.dob.max)
    && (filters.gender === null || user.profile.gender === filters.gender)
    && (filters.interests === null
      || filters.interests.every(i => user.profile.interests.includes(i)))
    && (filters.problemTopics === null
      || filters.problemTopics.every(i => user.profile.problemTopics.includes(i)))
  ) {
    return true;
  }

  return false;
};

export default isCompatible;