import setYear from './setYear.js';

const createFilters = (form) => {
  const filters = {
    dob: {
      min: form.ageMin ? setYear(form.ageMin) : null,
      max: form.ageMax ? setYear(form.ageMax) : null
    },
    gender: form.gender ? form.gender : null,
    interests: form.interests ? form.interests : null,
    problemTopics: form.problemTopics ? form.problemTopics : null
  };

  return filters;
};

export default createFilters;