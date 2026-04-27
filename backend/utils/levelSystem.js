import { getLevelTitle } from "./levelTitles.js";

export const LEVEL_THRESHOLDS = [
  0, // Level 1
  500, // Level 2
  1200, // Level 3
  2200, // Level 4
  3500, // Level 5
  5200, // Level 6
  7400, // Level 7
  10200, // Level 8
  13700, // Level 9
  18000, // Level 10
  23200, // Level 11
  29400, // Level 12
  36700, // Level 13
  45200, // Level 14
  55000, // Level 15
  66200, // Level 16
  78900, // Level 17
  93200, // Level 18
  109200, // Level 19
  127000, // Level 20
];

export const calculateLevelProgress = (xp = 0) => {
  const safeXp = Math.max(0, Number(xp) || 0);

  let level = 1;

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (safeXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    }
  }

  const maxLevel = LEVEL_THRESHOLDS.length;
  const currentLevelBaseXp = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextLevelXp =
    level >= maxLevel
      ? LEVEL_THRESHOLDS[maxLevel - 1]
      : LEVEL_THRESHOLDS[level];

  const progressNeeded =
    level >= maxLevel ? 0 : nextLevelXp - currentLevelBaseXp;

  const progressXp =
    level >= maxLevel ? 0 : Math.max(0, safeXp - currentLevelBaseXp);

  const xpRemaining = level >= maxLevel ? 0 : Math.max(0, nextLevelXp - safeXp);

  const progressPercent =
    level >= maxLevel || progressNeeded <= 0
      ? 100
      : Math.max(0, Math.min(100, (progressXp / progressNeeded) * 100));

  return {
    level,
    levelTitle: getLevelTitle(level),
    xp: safeXp,
    nextLevelXp,
    xpRemaining,
    currentLevelBaseXp,
    progressXp,
    progressNeeded,
    progressPercent,
    maxLevel,
  };
};
