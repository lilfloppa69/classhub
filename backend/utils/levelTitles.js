export const levelTitles = [
  "Starter",
  "Learner",
  "Contributor",
  "Practitioner",
  "Associate",
  "Specialist",
  "Professional",
  "Advanced Professional",
  "Senior Professional",
  "Expert",
  "Advisor",
  "Strategist",
  "Leader",
  "Innovator",
  "Architect",
  "Authority",
  "Distinguished Expert",
  "Master",
  "Elite Master",
  "Grand Authority",
];

export const getLevelTitle = (level = 1) => {
  if (level < 1) return levelTitles[0];
  if (level > 20) return levelTitles[19];
  return levelTitles[level - 1];
};