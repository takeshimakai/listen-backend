const isCompatible = (user, filters) => {
  if (
    (filters.minAge === null || user.profile.dob <= filters.minAge) &&
    (filters.maxAge === null || user.profile.dob >= filters.maxAge) &&
    (filters.gender === null || user.profile.gender === filters.gender) &&
    (filters.interests === null || filters.interests.every(i => user.profile.interests.includes(i))) &&
    (filters.problemTopics === null || filters.problemTopics.every(i => user.profile.problemTopics.includes(i)))
  ) {
    return true;
  }

  return false;
};

export default isCompatible;