import setYear from './setYear.js';

const createFilters = (form) => {
  const filters = {
    minAge: form.minAge ? setYear(form.minAge) : null,
    maxAge: form.maxAge ? setYear(form.maxAge) : null,
    gender: form.gender ? form.gender : null,
    interests: form.interests ? form.interests : null,
    problemTopics: form.problemTopics ? form.problemTopics : null
  };

  return filters;
};

export default createFilters;