export const specializationCategories = {
  academic: [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Literature",
    "Economics",
    "Geography",
    "Sociology",
    "Psychology",
    "Philosophy",
    "Political Science",
    "Anthropology",
    "Linguistics",
    "Statistics"
  ],

  skill: [
    "Programming",
    "Web Development",
    "Mobile Development",
    "UI/UX Design",
    "Graphic Design",
    "Data Science",
    "Machine Learning / AI",
    "Cybersecurity",
    "Cloud Computing",
    "Database Administration",
    "Video Editing",
    "Photography",
    "Digital Marketing",
    "Content Writing",
    "Social Media Management",
    "SEO / SEM",
    "Business & Entrepreneurship",
    "Accounting & Finance",
    "Project Management",
    "Public Speaking"
  ]
};

export const validateSpecialization = (specialization) => {

  if (!specialization || !specialization.category) {
    return false;
  }

  const { category, field } = specialization;

  if (category === "other") {
    return field && field.trim().length > 0;
  }

  if (!specializationCategories[category]) {
    return false;
  }

  return specializationCategories[category].includes(field);
};