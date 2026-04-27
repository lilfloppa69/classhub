import api from './api'

export const getMyClasses = async () => {
  const res = await api.get('/classes/my-classes')
  return res.data?.data || {}
}

export const transformGroupedClassesToCards = (groupedClasses) => {
  const classMap = new Map()

  Object.entries(groupedClasses || {}).forEach(([day, classes]) => {
    classes.forEach((cls) => {
      const id = cls._id

      if (!classMap.has(id)) {
        classMap.set(id, {
          _id: cls._id,
          title: cls.title,
          subject: cls.subject,
          teacher: cls.teacher,
          schedules: [],
        })
      }

      classMap.get(id).schedules.push({
        day,
        startTime: cls.startTime,
        endTime: cls.endTime,
      })
    })
  })

  return Array.from(classMap.values())
}

export async function createClass(payload) {
  const res = await api.post('/classes', payload)
  return res.data?.data
}

export async function leaveClass(classId) {
  const res = await api.post(`/classes/${classId}/leave`)
  return res.data
}

export async function joinClass(joinCode) {
  const res = await api.post('/classes/join', { joinCode })
  return res.data?.data
}