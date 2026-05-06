import ClassCard from '../components/home/ClassCard'
import { Clock3, LogIn, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  getMyClasses,
  leaveClass,
  transformGroupedClassesToCards,
} from '../services/classService'
import JoinClassModal from '../components/home/JoinClassModal'
import ConfirmModal from '../components/common/ConfirmModal'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import CreateClassModal from '../components/home/CreateClassModal'

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

const dayOrder = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

function getTeacherName(teacher) {
  return (
    teacher?.displayName ||
    teacher?.fullName ||
    teacher?.nickname ||
    teacher?.username ||
    teacher?.email ||
    'Teacher'
  )
}

function DayScheduleView({ groupedClasses, isLoading, onClassClick }) {
  const todayName = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
  })

  const normalizedGroups = groupedClasses || {}

  return (
    <div className="rounded-[32px] bg-[#fbfbfb] px-8 py-8 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
      <div className="mx-auto w-full max-w-[900px] space-y-7">
        {dayOrder.map((day) => {
          const items = normalizedGroups[day] || []
          const isToday = day === todayName

          return (
            <section key={day} className="group">
              <div className="mb-4 flex items-center gap-5">
                <h2 className="w-[86px] shrink-0 text-[16px] font-medium text-black/65">
                  {day}
                </h2>

                <div className="h-px flex-1 bg-black/35" />

                {isToday ? (
                  <span className="rounded-full border border-violet-500 px-4 py-1.5 text-xs font-medium text-violet-600">
                    Today
                  </span>
                ) : null}
              </div>

              <div className="space-y-3 pl-[6px] sm:pl-[96px]">
                {isLoading ? (
                  <div className="h-16 animate-pulse rounded-[14px] bg-slate-100" />
                ) : items.length > 0 ? (
                  items.map((cls) => {
                    const title = cls.title || 'Subject'
                    const teacherName = getTeacherName(cls.teacher)
                    const timeText =
                      cls.startTime && cls.endTime
                        ? `${cls.startTime} - ${cls.endTime}`
                        : 'Time - Time'

                    return (
                      <button
                        key={`${day}-${cls._id}-${cls.startTime}-${cls.endTime}`}
                        type="button"
                        onClick={() => onClassClick?.(cls._id)}
                        className="flex w-full items-center justify-between gap-5 rounded-[14px] border border-black/10 bg-[#f7f5f2] px-7 py-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                      >
                        <div className="flex min-w-0 items-center gap-6">
                          <span className="h-10 w-[2px] shrink-0 rounded-full bg-violet-500" />

                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-medium text-black">
                              {title}
                            </p>
                            <p className="mt-2 truncate text-[11px] text-black/60">
                              {teacherName}
                            </p>
                          </div>
                        </div>

                        <div className="hidden shrink-0 items-center gap-2 text-[11px] text-black/55 sm:flex">
                          <Clock3 className="h-3.5 w-3.5" />
                          <span>{timeText}</span>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="rounded-[14px] border border-dashed border-black/10 bg-white/50 px-5 py-5 text-sm text-black/35">
                    No class scheduled
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export default function Home({ classViewMode = 'grid' }) {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [groupedClasses, setGroupedClasses] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false)
  const [isJoinClassOpen, setIsJoinClassOpen] = useState(false)
  const [isFabOpen, setIsFabOpen] = useState(false)
  const [leaveTargetClass, setLeaveTargetClass] = useState(null)
  const [isLeaving, setIsLeaving] = useState(false)

  const fetchClasses = async () => {
    try {
      setIsLoading(true)
      const grouped = await getMyClasses()
      const transformed = transformGroupedClassesToCards(grouped)

      setGroupedClasses(grouped || {})
      setClasses(transformed)
    } catch (error) {
      console.error('Failed to fetch classes:', error)
      setGroupedClasses({})
      setClasses([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyClassLink = async (classId) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/classes/${classId}`,
      )
      toast.success('Class link copied')
    } catch (error) {
      toast.error('Failed to copy class link')
    }
  }

  const handleAskLeaveClass = (cls) => {
    setLeaveTargetClass(cls)
  }

  const handleConfirmLeaveClass = async () => {
    if (!leaveTargetClass?._id) return

    try {
      setIsLeaving(true)
      const res = await leaveClass(leaveTargetClass._id)

      toast.success(res?.message || 'Class updated')
      setLeaveTargetClass(null)
      await fetchClasses()
    } catch (error) {
      console.error('Failed to leave class:', error)
      toast.error(error.response?.data?.message || 'Failed to leave class')
    } finally {
      setIsLeaving(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])
  const isDayView = classViewMode === 'day'

  return (
    <div className="px-3 py-4 sm:px-6 sm:py-6">
      <div className="relative min-h-[760px] w-full rounded-[32px] bg-[#F8F8F8] px-4 pb-24 pt-6 sm:px-8 lg:px-10">
        {/* VIEW CONTENT */}
        <div
          key={isDayView ? 'day-view' : 'grid-view'}
          className="animate-[viewSwitch_260ms_ease-out]"
        >
          {isDayView ? (
            <DayScheduleView
              groupedClasses={groupedClasses}
              isLoading={isLoading}
              onClassClick={(classId) => navigate(`/classes/${classId}`)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-x-12 xl:gap-y-16">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <ClassCard
                    key={index}
                    subject="Loading..."
                    schedule="Loading..."
                    teacher="Loading..."
                  />
                ))
              ) : classes.length > 0 ? (
                classes.map((cls) => (
                  <ClassCard
                    key={cls._id}
                    onClick={() => navigate(`/classes/${cls._id}`)}
                    subject={cls.title || cls.subject}
                    schedule={
                      cls.schedules?.length
                        ? `${cls.schedules[0].day}, ${cls.schedules[0].startTime} - ${cls.schedules[0].endTime}`
                        : cls.schedule?.length
                          ? `${cls.schedule[0].day}, ${cls.schedule[0].startTime} - ${cls.schedule[0].endTime}`
                          : 'No schedule'
                    }
                    teacher={
                      cls.teacher?.fullName ||
                      cls.teacher?.displayName ||
                      cls.teacher?.nickname ||
                      cls.teacher?.username ||
                      'Unknown Teacher'
                    }
                    teacherAvatar={buildAvatarUrl(cls.teacher?.avatar)}
                    highlight
                    onLeave={() => handleAskLeaveClass(cls)}
                    onCopyLink={() => handleCopyClassLink(cls._id)}
                  />
                ))
              ) : (
                <div className="col-span-full flex min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-black/10 bg-white/40 text-center text-sm text-black/45">
                  No classes found
                </div>
              )}
            </div>
          )}
        </div>

        {/* FLOATING PLUS */}
        <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
          <div
            className={`flex flex-col items-end gap-3 transition-all duration-200 ${
              isFabOpen
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-5 opacity-0'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setIsCreateClassOpen(true)
                setIsFabOpen(false)
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#4e83f1] px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(78,131,241,0.3)] transition hover:-translate-y-0.5 hover:brightness-105"
            >
              <Plus className="h-4 w-4" />
              Create Class
            </button>

            <button
              type="button"
              onClick={() => {
                setIsJoinClassOpen(true)
                setIsFabOpen(false)
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#6b57d8] px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(107,87,216,0.3)] transition hover:-translate-y-0.5 hover:brightness-105"
            >
              <LogIn className="h-4 w-4" />
              Join Class
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFabOpen((prev) => !prev)}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_14px_35px_rgba(15,23,42,0.18)] ring-1 ring-black/5 transition hover:-translate-y-1"
          >
            <img
              src="/JaktViggen.svg"
              alt="Class actions"
              className={`h-11 w-11 object-contain transition-transform duration-200 ease-out ${
                isFabOpen ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </button>
        </div>
      </div>

      <CreateClassModal
        isOpen={isCreateClassOpen}
        onClose={() => setIsCreateClassOpen(false)}
        onCreated={() => {
          fetchClasses()
        }}
      />

      <JoinClassModal
        isOpen={isJoinClassOpen}
        onClose={() => setIsJoinClassOpen(false)}
        onJoined={fetchClasses}
      />

      <ConfirmModal
        isOpen={!!leaveTargetClass}
        title="Leave class?"
        message={`Are you sure you want to leave ${
          leaveTargetClass?.title || leaveTargetClass?.subject || 'this class'
        }?`}
        confirmText="Yes"
        cancelText="Yesn't"
        isLoading={isLeaving}
        onCancel={() => setLeaveTargetClass(null)}
        onConfirm={handleConfirmLeaveClass}
      />
    </div>
  )
}
