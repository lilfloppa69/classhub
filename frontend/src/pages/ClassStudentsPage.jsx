import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Search, GraduationCap, Users } from 'lucide-react'
import { getClassStudents } from '../services/classStudentService'

function StudentCard({
  name,
  avatar,
  level,
  levelTitle,
  badges = [],
  isTeacher = false,
}) {
  const avatarUrl = buildAvatarUrl(avatar)
  return (
    <div className="flex items-center justify-between rounded-[22px] bg-white px-6 py-5 shadow-sm ring-1 ring-black/5 transition hover:translate-y-[-1px] hover:shadow-md">
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full ${
            isTeacher ? 'bg-[#F5D9A8]' : 'bg-[#D9D9D9]'
          }`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[18px] font-semibold text-black">
              {(name || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-[18px] font-semibold text-black">
            {name}
          </p>
          <p className="text-[14px] text-black/60">
            Lvl {level} • {levelTitle}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <AchievementBadges badges={badges} />
          </div>
        </div>
      </div>

      <div
        className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-medium ${
          isTeacher ? 'bg-[#F4C56A] text-black' : 'bg-[#EDEDED] text-black/70'
        }`}
      >
        {isTeacher ? 'Teacher' : 'Student'}
      </div>
    </div>
  )
}

function buildAvatarUrl(avatar) {
  if (!avatar) return ''

  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }

  const apiBase =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:3000/api'

  const originOnly = apiBase.replace(/\/+$/, '').replace(/\/api$/, '')
  const normalizedAvatar = avatar.startsWith('/') ? avatar : `/${avatar}`

  return `${originOnly}${normalizedAvatar}`
}

function AchievementBadges({ badges = [] }) {
  if (!badges.length) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/10 text-[10px] font-semibold text-black/40">
        -
      </div>
    )
  }

  return (
    <>
      {badges.slice(0, 2).map((badge) => (
        <div
          key={badge._id}
          title={badge.title}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8c79eb] text-[10px] font-semibold text-white shadow-sm"
        >
          {badge.icon || badge.title?.charAt(0)?.toUpperCase() || 'A'}
        </div>
      ))}
    </>
  )
}

export default function ClassStudentsPage() {
  const { classId } = useParams()

  const [studentsData, setStudentsData] = useState({
    teacher: null,
    classmates: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true)
        const data = await getClassStudents(classId)
        setStudentsData(data)
      } catch (error) {
        console.error('Failed to fetch students:', error)
        setStudentsData({ teacher: null, classmates: [] })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudents()
  }, [classId])

  const filteredClassmates = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return studentsData.classmates

    return studentsData.classmates.filter((student) =>
      student.displayName?.toLowerCase().includes(keyword),
    )
  }, [studentsData.classmates, search])

  if (isLoading) {
    return (
      <div className="px-6 py-6">
        <div className="rounded-[32px] bg-[#F8F8F8] px-10 pt-8 pb-10">
          <div className="h-10 w-56 rounded bg-[#D9D9D9]" />
          <div className="mt-8 h-14 rounded-[22px] bg-[#D9D9D9]" />
          <div className="mt-8 h-40 rounded-[24px] bg-[#D9D9D9]" />
          <div className="mt-8 h-56 rounded-[24px] bg-[#D9D9D9]" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-6">
      <div className="rounded-[32px] bg-[#F8F8F8] px-10 pt-8 pb-10">
        {/* top */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-[34px] font-semibold text-black">Students</h1>
            <p className="mt-2 text-[15px] text-black/60">
              Teacher and classmates in this class
            </p>
          </div>

          <div className="grid min-w-[260px] grid-cols-2 gap-4">
            <div className="rounded-[20px] bg-[#F4C56A] px-5 py-4 text-black shadow-sm">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                <span className="text-[13px] font-medium">Teacher</span>
              </div>
              <p className="mt-3 text-[24px] font-semibold">
                {studentsData.teacher ? 1 : 0}
              </p>
            </div>

            <div className="rounded-[20px] bg-[#DDECC8] px-5 py-4 text-black shadow-sm">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-[13px] font-medium">Classmates</span>
              </div>
              <p className="mt-3 text-[24px] font-semibold">
                {studentsData.classmates.length}
              </p>
            </div>
          </div>
        </div>

        {/* search */}
        <div className="mt-8">
          <div className="relative max-w-[420px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search classmates..."
              className="w-full rounded-[18px] bg-white py-4 pl-5 pr-12 text-[15px] outline-none ring-1 ring-black/8 placeholder:text-black/35"
            />
            <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/40" />
          </div>
        </div>

        {/* teacher */}
        <section className="mt-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-[#F4C56A] px-4 py-2 text-[13px] font-semibold text-black">
              Teacher
            </div>
          </div>

          {studentsData.teacher ? (
            <StudentCard
              name={studentsData.teacher.displayName}
              avatar={studentsData.teacher.avatar}
              level={studentsData.teacher.level}
              levelTitle={studentsData.teacher.levelTitle}
              badges={studentsData.teacher.showcaseAchievements || []}
              isTeacher
            />
          ) : (
            <div className="rounded-[22px] bg-white px-6 py-6 text-black/50 shadow-sm ring-1 ring-black/5">
              No teacher data
            </div>
          )}
        </section>

        {/* classmates */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="rounded-full bg-[#DDECC8] px-4 py-2 text-[13px] font-semibold text-black">
              Classmates
            </div>

            <p className="text-[13px] text-black/50">
              {filteredClassmates.length} shown
            </p>
          </div>

          {filteredClassmates.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {filteredClassmates.map((student) => (
                <StudentCard
                  key={student._id}
                  name={student.displayName}
                  avatar={student.avatar}
                  level={student.level}
                  levelTitle={student.levelTitle}
                  badges={student.showcaseAchievements || []}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] bg-white px-6 py-6 text-black/50 shadow-sm ring-1 ring-black/5">
              No classmates found
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
