import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowRight,
  BookOpen,
  Copy,
  Megaphone,
  MessageSquare,
  Plus,
  Sparkles,
  Trophy,
  Users,
  BarChart3,
  Clock3,
  Lock,
  CheckCircle2,
} from 'lucide-react'
import api from '../services/api'
import { getClassStudents } from '../services/classStudentService'
import ClassForumModal from '../components/forum/ClassForumModal'
import CreateClassAchievementModal from '../components/class-detail/CreateClassAchievementModal'
import { useAuth } from '../context/AuthContext'
import { getClassAchievements } from '../services/achievementService'

function StatActionCard({
  icon: Icon,
  title,
  subtitle,
  color,
  iconBg,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[28px] p-6 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl ${color}`}
    >
      <div className="absolute right-[-28px] top-[-28px] h-28 w-28 rounded-full bg-white/20" />
      <div className="absolute bottom-[-38px] left-[-38px] h-32 w-32 rounded-full bg-white/10" />

      <div className="relative z-10 flex items-start justify-between gap-5">
        <div
          className={`flex h-13 w-13 items-center justify-center rounded-2xl ${iconBg}`}
        >
          <Icon className="h-6 w-6" />
        </div>

        <ArrowRight className="h-5 w-5 opacity-60 transition group-hover:translate-x-1 group-hover:opacity-100" />
      </div>

      <div className="relative z-10 mt-7">
        <h3 className="text-[22px] font-semibold tracking-[-0.02em]">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 opacity-75">{subtitle}</p>
      </div>
    </button>
  )
}

function ActivityItem({ item, onClick }) {
  const isAssignment = item.type === 'assignment'

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-[22px] border border-slate-100 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-100 hover:shadow-md"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
          isAssignment
            ? 'bg-blue-100 text-blue-600'
            : 'bg-violet-100 text-violet-600'
        }`}
      >
        {isAssignment ? (
          <BookOpen className="h-5 w-5" />
        ) : (
          <MessageSquare className="h-5 w-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-slate-900">
          {item.title}
        </p>
        <p className="mt-1 line-clamp-1 text-sm text-slate-500">
          {item.subtitle}
        </p>
      </div>

      <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-500" />
    </button>
  )
}

function TagPill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur">
      {children}
    </span>
  )
}

function ClassAchievementItem({ achievement, onClick }) {
  const isUnlocked = achievement.isUnlocked || achievement.isAchieved

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-[20px] border px-4 py-4 text-left transition ${
        isUnlocked
          ? 'border-white/20 bg-white/18 hover:bg-white/25'
          : 'border-white/10 bg-white/10 hover:bg-white/15'
      }`}
    >
      <div
        className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-lg font-semibold ${
          isUnlocked ? '' : 'blur-[0.4px]'
        }`}
      >
        {achievement.icon || achievement.title?.charAt(0)?.toUpperCase() || 'A'}

        {!isUnlocked ? (
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/80 text-white">
            <Lock className="h-3 w-3" />
          </div>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-semibold ${
            isUnlocked ? 'text-white' : 'text-white/70'
          }`}
        >
          {achievement.title}
        </p>

        <p className="mt-1 line-clamp-1 text-xs text-white/65">
          {achievement.description || 'Class milestone'}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] text-white/80">
            {achievement.rewardXP || 0} XP
          </span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] text-white/80">
            {achievement.rewardPoints || 0} pts
          </span>
        </div>
      </div>

      <div className="shrink-0">
        {isUnlocked ? (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-300/20 px-3 py-1.5 text-[11px] font-semibold text-emerald-100">
            <CheckCircle2 className="h-3.5 w-3.5" />
            You achieved it
          </div>
        ) : (
          <div className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/55">
            Not achieved yet
          </div>
        )}
      </div>
    </button>
  )
}

export default function ClassDetail({ activeTab }) {
  const { classId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [classData, setClassData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClassForumModalOpen, setIsClassForumModalOpen] = useState(false)
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false)
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false)
  const [studentsData, setStudentsData] = useState({
    teacher: null,
    classmates: [],
  })
  const [classAchievements, setClassAchievements] = useState([])

  const fetchClassDetail = async () => {
    try {
      const res = await api.get(`/classes/${classId}`)
      setClassData(res.data?.data || null)
    } catch (error) {
      console.error('Failed to fetch class detail:', error)
      setClassData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClassAchievements = async () => {
    try {
      const data = await getClassAchievements(classId)
      setClassAchievements(data)
    } catch (error) {
      console.error('Failed to fetch class achievements:', error)
      setClassAchievements([])
    }
  }

  useEffect(() => {
    setIsLoading(true)
    fetchClassDetail()
    fetchClassAchievements()
  }, [classId])

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await getClassStudents(classId)
        setStudentsData(data)
      } catch (error) {
        console.error('Failed to fetch class students:', error)
        setStudentsData({ teacher: null, classmates: [] })
      }
    }

    fetchStudents()
  }, [classId])

  useEffect(() => {
    if (activeTab === 'forum') {
      navigate(`/classes/${classId}/forum`)
    }
  }, [activeTab, classId, navigate])

  const classLink = `${window.location.origin}/classes/${classId}`

  const isTeacher =
    classData?.teacher?._id?.toString?.() === user?._id?.toString?.() ||
    classData?.teacher?.toString?.() === user?._id?.toString?.()

  const scheduleText =
    classData?.schedule?.length > 0
      ? classData.schedule
          .map((item) => `${item.day}, ${item.startTime} - ${item.endTime}`)
          .join(' • ')
      : 'No schedule'

  const recentActivities = useMemo(() => {
    if (!classData) return []

    const assignmentItems = (classData.quickAssignments || []).map((item) => ({
      id: `assignment-${item._id}`,
      rawId: item._id,
      type: 'assignment',
      title: item.title || 'Untitled Assignment',
      subtitle: item.createdAt
        ? `Task posted • ${new Date(item.createdAt).toLocaleString()}`
        : 'Task posted',
    }))

    const forumItems = (classData.quickForums || []).map((item) => ({
      id: `forum-${item._id}`,
      rawId: item._id,
      type: 'forum',
      title: (item.title || 'Untitled Forum').replace(/<[^>]+>/g, ''),
      subtitle: item.createdAt
        ? `${item.tag || 'forum'} • ${new Date(item.createdAt).toLocaleString()}`
        : item.tag || 'forum',
    }))

    return [...assignmentItems, ...forumItems]
      .sort((a, b) => (a.subtitle < b.subtitle ? 1 : -1))
      .slice(0, 6)
  }, [classData])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(classLink)
      toast.success('Class link copied')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleActivityClick = (item) => {
    if (item.type === 'assignment') {
      navigate(`/classes/${classId}/assignments/${item.rawId}/detail`)
      return
    }

    navigate(`/classes/${classId}/forum/${item.rawId}`)
  }

  if (isLoading) {
    return (
      <div className="px-6 py-6">
        <div className="rounded-[32px] bg-[#F8F8F8] px-8 py-8">
          <div className="h-10 w-72 rounded-2xl bg-slate-200" />
          <div className="mt-8 h-[250px] rounded-[30px] bg-slate-200" />
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-44 rounded-[28px] bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="px-6 py-6">
        <div className="rounded-[32px] bg-[#F8F8F8] px-8 py-12 text-center text-black/60">
          Class not found
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="px-6 py-6">
        <div className="mt-2 w-full rounded-[34px] bg-[#F8F8F8] px-8 pt-8 pb-10 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
          <div className="relative overflow-hidden rounded-[34px] bg-gradient-to-r from-[#5f55e8] via-[#6c93ef] to-[#65c4df] px-9 py-8 text-white shadow-[0_22px_60px_rgba(80,95,220,0.25)]">
            <div className="absolute right-[-70px] top-[-80px] h-72 w-72 rounded-full bg-white/15" />
            <div className="absolute bottom-[-90px] left-[32%] h-52 w-52 rounded-full bg-white/10" />

            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <TagPill>Class Detail</TagPill>
                  <TagPill>{studentsData.classmates.length} students</TagPill>
                </div>

                <h1 className="mt-6 max-w-[760px] break-words text-[44px] font-semibold leading-tight tracking-[-0.03em]">
                  {classData.subject || classData.title}
                </h1>

                <p className="mt-4 flex items-center gap-2 text-[16px] text-white/85">
                  <Clock3 className="h-5 w-5" />
                  {scheduleText}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-3 rounded-[26px] bg-white/15 p-4 backdrop-blur">
                <img
                  src="/jaktviggen.svg"
                  alt="Class logo"
                  className="mx-auto h-16 w-16 object-contain"
                />

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-white px-5 py-3 text-sm font-semibold text-[#5f55e8] transition hover:brightness-95"
                >
                  <Copy className="h-4 w-4" />
                  {classData.joinCode || 'No Code'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setIsAchievementModalOpen(true)}
              className="inline-flex h-12 items-center gap-3 rounded-[18px] bg-[#4e83f1] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(78,131,241,0.25)] transition hover:-translate-y-0.5 hover:brightness-105"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                <Plus className="h-4 w-4" />
              </span>
              Create Achievement
            </button>

            <button
              type="button"
              onClick={() => setIsAnnouncementModalOpen(true)}
              className="inline-flex h-12 items-center gap-3 rounded-[18px] bg-[#f7c948] px-5 text-sm font-semibold text-slate-900 shadow-[0_12px_28px_rgba(247,201,72,0.25)] transition hover:-translate-y-0.5 hover:brightness-105"
            >
              <Megaphone className="h-5 w-5" />
              Announce Something
            </button>

            <button
              type="button"
              onClick={() => setIsClassForumModalOpen(true)}
              className="inline-flex h-12 items-center gap-3 rounded-[18px] bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <MessageSquare className="h-5 w-5 text-violet-500" />
              Start Forum
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatActionCard
              icon={BookOpen}
              title="Tasks"
              subtitle="Open assignments, submissions, and evaluations."
              color="bg-[#e7f0ff] text-[#285cc7]"
              iconBg="bg-white text-[#3f73f4]"
              onClick={() => navigate(`/classes/${classId}/assignments`)}
            />

            <StatActionCard
              icon={MessageSquare}
              title="Forum"
              subtitle="Join class discussions and announcements."
              color="bg-[#f1eaff] text-[#6b43c7]"
              iconBg="bg-white text-[#7c4dff]"
              onClick={() => navigate(`/classes/${classId}/forum`)}
            />

            <StatActionCard
              icon={Users}
              title="Students"
              subtitle="View teacher, classmates, avatars, and badges."
              color="bg-[#eaf8ef] text-[#277a46]"
              iconBg="bg-white text-[#35a65a]"
              onClick={() => navigate(`/classes/${classId}/students`)}
            />

            <StatActionCard
              icon={BarChart3}
              title="Leaderboard"
              subtitle="Track class points, XP, and top students."
              color="bg-[#fff3d8] text-[#9b6500]"
              iconBg="bg-white text-[#e29b16]"
              onClick={() => navigate(`/classes/${classId}/leaderboard`)}
            />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[30px] bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-medium text-violet-700">
                    <Sparkles className="h-4 w-4" />
                    Recent Activity
                  </div>
                  <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.02em] text-slate-900">
                    What’s happening
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {recentActivities.length > 0 ? (
                  recentActivities.map((item) => (
                    <ActivityItem
                      key={item.id}
                      item={item}
                      onClick={() => handleActivityClick(item)}
                    />
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                    <p className="text-[16px] font-medium text-slate-700">
                      No recent activity yet
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Create an announcement, forum, or assignment to fill this
                      area.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="flex max-h-[560px] min-h-[520px] flex-col rounded-[30px] bg-gradient-to-br from-[#8c79eb] to-[#69b2e2] p-6 text-white shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                    <Trophy className="h-6 w-6" />
                  </div>

                  <h2 className="mt-5 text-[26px] font-semibold tracking-[-0.02em]">
                    Class Achievements
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-white/80">
                    Custom milestones students can unlock in this class.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAchievementModalOpen(true)}
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[16px] bg-white px-4 text-sm font-semibold text-[#5f55e8] transition hover:brightness-95"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>

              <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
                {classAchievements.length > 0 ? (
                  <div className="space-y-3">
                    {classAchievements.map((achievement) => (
                      <ClassAchievementItem
                        key={achievement._id}
                        achievement={achievement}
                        onClick={() => {
                          toast('Achievement detail modal nanti kita sambung')
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full min-h-[260px] items-center justify-center rounded-[24px] border border-dashed border-white/25 bg-white/10 px-5 text-center">
                    <div>
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                        <Trophy className="h-7 w-7 text-white/80" />
                      </div>

                      <p className="mt-4 text-sm font-semibold text-white">
                        No class achievements yet
                      </p>

                      <p className="mt-2 text-sm leading-6 text-white/65">
                        Create custom achievements for this class and let
                        students unlock them through activity.
                      </p>

                      <button
                        type="button"
                        onClick={() => setIsAchievementModalOpen(true)}
                        className="mt-5 inline-flex items-center gap-2 rounded-[16px] bg-white px-5 py-3 text-sm font-semibold text-[#5f55e8] transition hover:brightness-95"
                      >
                        <Plus className="h-4 w-4" />
                        Create Achievement
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <ClassForumModal
        isOpen={isClassForumModalOpen}
        onClose={() => setIsClassForumModalOpen(false)}
        classId={classId}
        className={classData?.title || classData?.subject || ''}
        onCreated={fetchClassDetail}
      />

      <ClassForumModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        classId={classId}
        className={classData?.title || classData?.subject || ''}
        onCreated={fetchClassDetail}
        lockedTag="announcement"
      />

      <CreateClassAchievementModal
        isOpen={isAchievementModalOpen}
        onClose={() => setIsAchievementModalOpen(false)}
        classId={classId}
        students={studentsData.classmates || []}
        onCreated={() => {
          fetchClassDetail()
          fetchClassAchievements()
          toast.success('Achievement ready for this class')
        }}
      />
    </>
  )
}
