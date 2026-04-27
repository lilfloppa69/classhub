import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Plus,
  FileText,
  Sparkles,
} from 'lucide-react'
import CreateAssignmentModal from '../components/assignment/CreateAssignmentModal'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function formatDate(date) {
  if (!date) return '-'

  const value = new Date(date)

  const datePart = value.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const timePart = value.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${datePart} • ${timePart}`
}

function getStatusStyle(status) {
  const value = String(status || '').toLowerCase()

  if (value === 'submitted') {
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
  }

  if (value === 'failed') {
    return 'bg-red-100 text-red-700 border border-red-200'
  }

  return 'bg-amber-100 text-amber-700 border border-amber-200'
}

export default function ClassAssignmentsPage() {
  const { classId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [groups, setGroups] = useState([])
  const [classInfo, setClassInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [openTopics, setOpenTopics] = useState({})
  const [isCreateAssignmentModalOpen, setIsCreateAssignmentModalOpen] =
    useState(false)
  const [isTeacher, setIsTeacher] = useState(false)

  const fetchClassInfo = async () => {
    try {
      const res = await api.get(`/classes/${classId}`)
      setClassInfo(res.data?.data || null)
    } catch (error) {
      console.error('Failed to fetch class info:', error)
      setClassInfo(null)
    }
  }

  const fetchAssignments = async () => {
    try {
      setIsLoading(true)

      const params = {}
      if (selectedTopic !== 'all') {
        params.topic = selectedTopic
      }

      const res = await api.get(`/classes/${classId}/assignments`, { params })
      const data = res.data?.data || []

      setGroups(data)

      setOpenTopics((prev) => {
        const next = {}
        data.forEach((group, index) => {
          next[group.topic] = prev[group.topic] ?? index === 0
        })
        return next
      })
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
      setGroups([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClassInfo()
  }, [classId])

  useEffect(() => {
    fetchAssignments()
  }, [classId, selectedTopic])

  const topicOptions = useMemo(() => {
    const uniqueTopics = Array.from(
      new Set(groups.map((item) => item.topic).filter(Boolean)),
    )
    return ['all', ...uniqueTopics]
  }, [groups])

  const isTeacherOrHybrid = useMemo(() => {
    if (!classInfo || !user?._id) return false

    const userId = String(user._id)

    if (String(classInfo.teacher?._id || classInfo.teacher || '') === userId) {
      return true
    }

    if (Array.isArray(classInfo.hybridStudents)) {
      return classInfo.hybridStudents.some(
        (item) => String(item?._id || item) === userId,
      )
    }

    if (Array.isArray(classInfo.hybrids)) {
      return classInfo.hybrids.some(
        (item) => String(item?._id || item) === userId,
      )
    }

    if (Array.isArray(classInfo.members)) {
      return classInfo.members.some((member) => {
        const memberId = String(
          member?.user?._id || member?.user || member?._id || '',
        )
        const role = String(member?.role || '').toLowerCase()

        return memberId === userId && ['teacher', 'hybrid'].includes(role)
      })
    }

    return false
  }, [classInfo, user])

  const toggleTopic = (topic) => {
    setOpenTopics((prev) => ({
      ...prev,
      [topic]: !prev[topic],
    }))
  }

  const handleCollapseAll = () => {
    const hasAnyOpen = Object.values(openTopics).some(Boolean)

    const next = {}
    groups.forEach((group) => {
      next[group.topic] = !hasAnyOpen
    })

    setOpenTopics(next)
  }

  if (isLoading) {
    return (
      <div className="px-6 py-6">
        <div className="rounded-[32px] border border-violet-100 bg-gradient-to-br from-[#fcfbff] via-[#f8f5ff] to-[#f2f7ff] px-8 py-8 shadow-[0_20px_60px_rgba(124,58,237,0.08)]">
          <div className="h-10 w-56 rounded-xl bg-violet-100" />
          <div className="mt-6 h-16 rounded-2xl bg-white" />
          <div className="mt-6 h-40 rounded-2xl bg-white" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-6">
      <div className="rounded-[32px] border border-violet-100 bg-gradient-to-br from-[#fcfbff] via-[#f8f5ff] to-[#f2f7ff] px-8 pt-8 pb-10 shadow-[0_20px_60px_rgba(124,58,237,0.08)]">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-medium text-violet-700">
              <Sparkles className="h-4 w-4" />
              Assignments
            </div>

            <h1 className="text-[34px] font-semibold tracking-[-0.02em] text-slate-900">
              Class Assignments
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isTeacherOrHybrid ? (
              <button
                type="button"
                onClick={() => setIsCreateAssignmentModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                Create
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleCollapseAll}
              className="text-sm cursor-pointer font-medium text-violet-600 transition hover:text-violet-800"
            >
              Collapse All
            </button>

            <div className="min-w-[220px]">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Filter Topic
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full rounded-[16px] border border-violet-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-violet-400"
              >
                {topicOptions.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic === 'all' ? 'All Topics' : topic}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {groups.length > 0 ? (
            groups.map((group) => {
              const isOpen = !!openTopics[group.topic]

              return (
                <div key={group.topic}>
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <h2 className="text-[28px] font-semibold text-slate-900">
                      {group.topic}
                    </h2>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleTopic(group.topic)}
                        className="rounded-full bg-white p-2 text-slate-700 shadow-sm transition hover:bg-violet-50 hover:text-violet-700"
                      >
                        <ChevronDown
                          className={`h-5 w-5 transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        className="rounded-full bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div
                        className={`space-y-4 pt-1 transition-all duration-500 ease-in-out ${
                          isOpen
                            ? 'translate-y-0 scale-100'
                            : '-translate-y-2 scale-[0.98]'
                        }`}
                      >
                        {group.assignments.map((assignment) => (
                          <div
                            key={assignment._id}
                            className="rounded-[24px] bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-slate-100 backdrop-blur"
                          >
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                  <h3 className="text-xl font-semibold text-slate-800">
                                    {assignment.title}
                                  </h3>
                                </div>

                                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                                      <p>
                                        Posted on{' '}
                                        <span className="font-medium text-slate-700">
                                          {formatDate(assignment.postedAt)}
                                        </span>
                                      </p>

                                      <p>
                                        Due:{' '}
                                        <span className="font-medium text-slate-700">
                                          {formatDate(assignment.dueDate)}
                                        </span>
                                      </p>
                                    </div>

                                    {assignment.teacherFiles?.length > 0 ? (
                                      <div className="mt-5 flex flex-wrap gap-3">
                                        {assignment.teacherFiles.map(
                                          (file, index) => (
                                            <div
                                              key={file.url || index}
                                              className="flex items-center gap-3 rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3"
                                            >
                                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                                                <FileText className="h-4 w-4" />
                                              </div>

                                              <div className="min-w-0">
                                                <p className="max-w-[180px] truncate text-sm font-medium text-slate-700">
                                                  {file.originalName ||
                                                    file.name ||
                                                    'Attachment'}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                  File
                                                </p>
                                              </div>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="flex shrink-0 items-start gap-6 border-l border-slate-200 pl-6 lg:ml-6">
                                    <div className="flex min-w-[72px] flex-col items-center text-center">
                                      <span className="text-[28px] font-semibold leading-none text-amber-600">
                                        {assignment.assignedCount ?? 0}
                                      </span>
                                      <span className="mt-2 text-[14px] font-medium text-slate-500">
                                        Assigned
                                      </span>
                                    </div>

                                    <div className="h-[56px] w-px bg-slate-200" />

                                    <div className="flex min-w-[72px] flex-col items-center text-center">
                                      <span className="text-[28px] font-semibold leading-none text-emerald-600">
                                        {assignment.submittedCount ?? 0}
                                      </span>
                                      <span className="mt-2 text-[14px] font-medium text-slate-500">
                                        Submitted
                                      </span>
                                    </div>

                                    <div className="h-[56px] w-px bg-slate-200" />

                                    <div className="flex min-w-[72px] flex-col items-center text-center">
                                      <span className="text-[28px] font-semibold leading-none text-red-600">
                                        {assignment.failedCount ?? 0}
                                      </span>
                                      <span className="mt-2 text-[14px] font-medium text-slate-500">
                                        Failed
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex min-w-[170px] flex-col items-end gap-3">
                                {isTeacherOrHybrid && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(
                                        `/classes/${classId}/assignments/${assignment._id}/evaluate`,
                                      )
                                    }
                                    className="rounded-[14px] border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                                  >
                                    Review
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/classes/${classId}/assignments/${assignment._id}/detail`,
                                    )
                                  }
                                  className="rounded-[14px] border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                                >
                                  Detail
                                </button>

                                {assignment.submittedAt ? (
                                  <p className="text-xs text-emerald-600">
                                    Submitted at{' '}
                                    {formatDate(assignment.submittedAt)}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/70 px-6 py-12 text-center">
              <p className="text-base font-medium text-slate-700">
                No assignments found
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Try another topic filter or create a new assignment.
              </p>
            </div>
          )}
        </div>
      </div>
      <CreateAssignmentModal
        isOpen={isCreateAssignmentModalOpen}
        onClose={() => setIsCreateAssignmentModalOpen(false)}
        classId={classId}
        className={classInfo?.title || classInfo?.subject || ''}
        onCreated={fetchAssignments}
      />
    </div>
  )
}
