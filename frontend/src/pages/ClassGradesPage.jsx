import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronDown,
  MoreVertical,
  PencilLine,
  ClipboardCheck,
} from 'lucide-react'
import CreateAssignmentModal from '../components/assignment/CreateAssignmentModal'
import toast from 'react-hot-toast'
import api from '../services/api'

function formatDueDate(date) {
  if (!date) return 'No due date'

  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
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

function StudentCell({ student }) {
  const avatarUrl = buildAvatarUrl(student.avatar)

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#7478c9] text-sm font-semibold text-white">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={student.displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          (student.displayName || '?').charAt(0).toUpperCase()
        )}
      </div>

      <p className="truncate text-[15px] font-semibold text-slate-900">
        {student.displayName}
      </p>
    </div>
  )
}

export default function ClassGradesPage() {
  const { classId } = useParams()
  const navigate = useNavigate()

  const [gradebook, setGradebook] = useState({
    assignments: [],
    students: [],
    assignmentAverages: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState('name')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [isEditAssignmentOpen, setIsEditAssignmentOpen] = useState(false)
  const [editAssignmentId, setEditAssignmentId] = useState('')

  const fetchGradebook = async () => {
    try {
      setIsLoading(true)
      const res = await api.get(`/classes/${classId}/grades`)
      setGradebook(
        res.data?.data || {
          assignments: [],
          students: [],
          assignmentAverages: [],
        },
      )
    } catch (error) {
      console.error('Failed to fetch gradebook:', error)
      toast.error(error.response?.data?.message || 'Failed to load grades')
      setGradebook({
        assignments: [],
        students: [],
        assignmentAverages: [],
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGradebook()
  }, [classId])

  const sortedStudents = useMemo(() => {
    const rows = [...(gradebook.students || [])]

    if (sortBy === 'averageDesc') {
      return rows.sort((a, b) => (b.average || 0) - (a.average || 0))
    }

    if (sortBy === 'averageAsc') {
      return rows.sort((a, b) => (a.average || 0) - (b.average || 0))
    }

    return rows.sort((a, b) =>
      String(a.displayName || '').localeCompare(String(b.displayName || '')),
    )
  }, [gradebook.students, sortBy])

  const averageMap = useMemo(() => {
    const map = new Map()

    ;(gradebook.assignmentAverages || []).forEach((item) => {
      map.set(String(item.assignmentId), item.average)
    })

    return map
  }, [gradebook.assignmentAverages])

  const getGradeForAssignment = (student, assignmentId) => {
    return student.grades?.find(
      (grade) => String(grade.assignmentId) === String(assignmentId),
    )
  }

  const handleGrade = (assignmentId) => {
    navigate(`/classes/${classId}/assignments/${assignmentId}/evaluate`)
  }

  const handleEdit = (assignment) => {
    setEditAssignmentId(assignment._id)
    setIsEditAssignmentOpen(true)
  }

  if (isLoading) {
    return (
      <div className="px-6 py-6">
        <div className="rounded-[32px] bg-[#f8f8f8] p-8">
          <div className="h-10 w-72 rounded-xl bg-slate-200" />
          <div className="mt-8 h-[520px] rounded-[28px] bg-slate-100" />
        </div>
      </div>
    )
  }

  const hasAssignments = gradebook.assignments.length > 0

  return (
    <div className="px-6 py-6">
      <div className="rounded-[32px] border border-slate-200 bg-[#f8f8f8] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
              Class
            </p>
            <h1 className="mt-1 text-[34px] font-semibold tracking-[-0.02em] text-slate-900">
              Grades
            </h1>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-14 min-w-[250px] appearance-none rounded-[18px] border border-slate-200 bg-white px-5 pr-12 text-[15px] text-slate-800 shadow-sm outline-none"
            >
              <option value="name">Sort by name</option>
              <option value="averageDesc">Average: highest first</option>
              <option value="averageAsc">Average: lowest first</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {!hasAssignments ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white">
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-700">
                No assignments yet
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Grades will appear here after assignments are created.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white">
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-max border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-white">
                    <th className="sticky left-0 z-30 min-w-[280px] border-r border-slate-200 bg-white px-5 py-4 text-left text-sm font-semibold text-slate-700">
                      Students
                    </th>

                    {gradebook.assignments.map((assignment) => (
                      <th
                        key={assignment._id}
                        className="min-w-[210px] border-r border-slate-200 bg-white px-4 py-3 text-left align-top"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium text-slate-400">
                              {formatDueDate(assignment.dueDate)}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleGrade(assignment._id)}
                              className="mt-1 line-clamp-2 text-left text-[15px] font-semibold text-blue-600 underline-offset-2 hover:underline"
                            >
                              {assignment.title}
                            </button>
                            <p className="mt-3 text-xs text-slate-500">
                              dari {assignment.maximumScore || 0}
                            </p>
                          </div>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId((prev) =>
                                  prev === assignment._id
                                    ? null
                                    : assignment._id,
                                )
                              }
                              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>

                            {openMenuId === assignment._id ? (
                              <div className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-xl">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    handleGrade(assignment._id)
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                >
                                  <ClipboardCheck className="h-4 w-4" />
                                  Grade
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    handleEdit(assignment)
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                >
                                  <PencilLine className="h-4 w-4" />
                                  Edit
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </th>
                    ))}

                    <th className="sticky right-[130px] z-30 min-w-[130px] border-l border-r border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold text-slate-700">
                      Average
                    </th>

                    <th className="sticky right-0 z-30 min-w-[130px] border-l border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold text-slate-700">
                      Total
                    </th>
                  </tr>

                  <tr className="border-b border-slate-200 bg-[#f5f8fc]">
                    <td className="sticky left-0 z-20 border-r border-slate-200 bg-[#f5f8fc] px-5 py-4 text-sm font-semibold text-slate-800">
                      Class Average
                    </td>

                    {gradebook.assignments.map((assignment) => (
                      <td
                        key={`avg-${assignment._id}`}
                        className="border-r border-slate-200 px-4 py-4 text-[15px] font-semibold text-emerald-700"
                      >
                        {averageMap.get(String(assignment._id)) ?? '-'}
                      </td>
                    ))}

                    <td className="sticky right-[130px] z-20 border-l border-r border-slate-200 bg-[#f5f8fc] px-4 py-4 text-center text-sm font-semibold text-slate-700">
                      -
                    </td>

                    <td className="sticky right-0 z-20 border-l border-slate-200 bg-[#f5f8fc] px-4 py-4 text-center text-sm font-semibold text-slate-700">
                      -
                    </td>
                  </tr>
                </thead>

                <tbody>
                  {sortedStudents.map((student) => (
                    <tr
                      key={student._id}
                      className="border-b border-slate-200 last:border-b-0"
                    >
                      <td className="sticky left-0 z-10 min-w-[280px] border-r border-slate-200 bg-white px-5 py-4">
                        <StudentCell student={student} />
                      </td>

                      {gradebook.assignments.map((assignment) => {
                        const grade = getGradeForAssignment(
                          student,
                          assignment._id,
                        )

                        return (
                          <td
                            key={`${student._id}-${assignment._id}`}
                            className="min-w-[210px] border-r border-slate-200 px-4 py-4 align-middle"
                          >
                            {grade?.score !== null &&
                            grade?.score !== undefined ? (
                              <div>
                                <p className="text-[17px] font-semibold text-slate-900">
                                  {grade.score}
                                </p>
                                <p className="mt-1 text-xs capitalize text-slate-400">
                                  {grade.status}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-300">-</span>
                            )}
                          </td>
                        )
                      })}

                      <td className="sticky right-[130px] z-10 border-l border-r border-slate-200 bg-white px-4 py-4 text-center">
                        <span className="text-[16px] font-semibold text-slate-900">
                          {student.average || 0}
                        </span>
                      </td>

                      <td className="sticky right-0 z-10 border-l border-slate-200 bg-white px-4 py-4 text-center">
                        <span className="text-[16px] font-semibold text-slate-900">
                          {student.totalScore || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <CreateAssignmentModal
        isOpen={isEditAssignmentOpen}
        onClose={() => {
          setIsEditAssignmentOpen(false)
          setEditAssignmentId('')
        }}
        classId={classId}
        assignmentId={editAssignmentId}
        mode="edit"
        onCreated={() => {
          fetchGradebook()
        }}
      />
    </div>
  )
}
