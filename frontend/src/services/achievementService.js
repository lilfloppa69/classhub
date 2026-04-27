import api from './api'

export async function getClassAchievements(classId) {
  const res = await api.get(`/classes/${classId}/achievements`)
  return res.data?.data || []
}

export async function createClassAchievement(classId, payload) {
  const res = await api.post(`/classes/${classId}/achievements`, payload)
  return res.data?.data
}

// Untuk nanti, kalau backend manual give sudah dibuat
export async function giveClassAchievementEarly(
  classId,
  achievementId,
  userIds,
) {
  const res = await api.post(
    `/classes/${classId}/achievements/${achievementId}/give-early`,
    {
      userIds,
    },
  )

  return res.data?.data
}
