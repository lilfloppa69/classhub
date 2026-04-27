import api from './api'

export const getClassStudents = async (classId) => {
  const res = await api.get(`/classes/${classId}/students`)
  return res.data?.data || { teacher: null, classmates: [] }
}
