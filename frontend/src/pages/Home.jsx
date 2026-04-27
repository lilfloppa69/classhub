import ClassCard from '../components/home/ClassCard'
import { LogIn, Plus } from 'lucide-react'
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

export default function Home() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
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
      setClasses(transformed)
    } catch (error) {
      console.error('Failed to fetch classes:', error)
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
  return (
    <div className="px-6 py-6">
      <div className="relative min-h-[760px] w-full rounded-[32px] bg-[#F8F8F8] px-10 pt-8 pb-24">
        {/* GRID */}
        <div className="grid grid-cols-3 gap-x-12 gap-y-16">
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
            classes.map((cls, index) => (
              <ClassCard
                onClick={() => navigate(`/classes/${cls._id}`)}
                key={cls._id}
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
                  'Unknown Teacher'
                }
                teacherAvatar={buildAvatarUrl(cls.teacher?.avatar)}
                highlight={true}
                onLeave={() => handleAskLeaveClass(cls)}
                onCopyLink={() => handleCopyClassLink(cls._id)}
              />
            ))
          ) : (
            <div className="col-span-3 text-center text-black/50">
              No classes found
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
