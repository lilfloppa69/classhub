import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import api from '../services/api'

const tabs = [
  {
    key: 'assigned',
    label: 'Ditugaskan',
  },
  {
    key: 'notSubmitted',
    label: 'Belum Diserahkan',
  },
  {
    key: 'completed',
    label: 'Selesai',
  },
]

const sectionConfig = {
  assigned: [
    {
      key: 'noDueDate',
      label: 'Tak ada batas waktu',
    },
    {
      key: 'thisWeek',
      label: 'Minggu ini',
    },
    {
      key: 'nextWeek',
      label: 'Minggu berikutnya',
    },
    {
      key: 'later',
      label: 'Nanti',
    },
  ],
  notSubmitted: [
    {
      key: 'thisWeek',
      label: 'Minggu ini',
    },
    {
      key: 'lastWeek',
      label: 'Minggu lalu',
    },
    {
      key: 'earlier',
      label: 'Lebih awal',
    },
  ],
  completed: [
    {
      key: 'noDueDate',
      label: 'Tak ada batas waktu',
    },
    {
      key: 'completedEarly',
      label: 'Selesai lebih awal',
    },
    {
      key: 'thisWeek',
      label: 'Minggu ini',
    },
    {
      key: 'lastWeek',
      label: 'Minggu lalu',
    },
    {
      key: 'earlier',
      label: 'Lebih awal',
    },
  ],
}

const emptyTasks = {
  assigned: {
    noDueDate: [],
    thisWeek: [],
    nextWeek: [],
    later: [],
  },
  notSubmitted: {
    thisWeek: [],
    lastWeek: [],
    earlier: [],
  },
  completed: {
    noDueDate: [],
    completedEarly: [],
    thisWeek: [],
    lastWeek: [],
    earlier: [],
  },
}

function formatDate(value) {
  if (!value) return ''

  return new Date(value).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getTaskId(task) {
  return task.assignmentId || task._id || task.id
}

function getClassId(task) {
  return task.classId?._id || task.classId || task.class || task.class_id
}

function getTaskTitle(task) {
  return task.title || task.assignmentTitle || 'Untitled task'
}

function getTaskClassName(task) {
  return (
    task.className ||
    task.classTitle ||
    task.subject ||
    task.classId?.title ||
    task.classId?.subject ||
    'Unknown class'
  )
}

function getTaskDateText(task, activeTab) {
  if (activeTab === 'completed') {
    return task.submittedAt
      ? `Diserahkan ${formatDate(task.submittedAt)}`
      : 'Diserahkan'
  }

  if (activeTab === 'notSubmitted') {
    return task.dueDate
      ? `${formatDate(task.dueDate)}`
      : task.statusText || 'Tidak menerima tugas'
  }

  if (task.dueDate) {
    return `Batas waktu ${formatDate(task.dueDate)}`
  }

  if (task.createdAt) {
    return `Diposting ${formatDate(task.createdAt)}`
  }

  return task.statusText || ''
}

function getTaskIcon(activeTab, index) {
  if (activeTab === 'completed') {
    return {
      icon: CheckCircle2,
      className: 'bg-emerald-100 text-emerald-600',
    }
  }

  if (activeTab === 'notSubmitted') {
    return {
      icon: AlertCircle,
      className: 'bg-rose-100 text-rose-600',
    }
  }

  const colors = [
    'bg-cyan-100 text-cyan-700',
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-orange-100 text-orange-700',
  ]

  return {
    icon: ClipboardList,
    className: colors[index % colors.length],
  }
}

function TaskRow({ task, activeTab, index, onClick }) {
  const { icon: Icon, className } = getTaskIcon(activeTab, index)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group grid w-full grid-cols-[56px_minmax(0,1fr)_220px] items-center gap-4 border-b border-black/10 px-4 py-5 text-left transition hover:bg-slate-50 max-md:grid-cols-[48px_minmax(0,1fr)]"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${className}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold text-slate-900">
          {getTaskTitle(task)}
        </p>
        <p className="mt-1 truncate text-sm text-slate-500">
          {getTaskClassName(task)}
        </p>

        {activeTab === 'assigned' && task.createdAt ? (
          <p className="mt-2 text-xs text-slate-500">
            Diposting {formatDate(task.createdAt)}
          </p>
        ) : null}
      </div>

      <div className="text-right text-sm text-slate-500 max-md:col-span-2 max-md:pl-[64px] max-md:text-left">
        <p className="font-medium">{getTaskDateText(task, activeTab)}</p>

        {activeTab === 'notSubmitted' ? (
          <p className="mt-1 italic">Tidak menerima tugas</p>
        ) : null}
      </div>
    </button>
  )
}

function TaskSection({
  label,
  tasks,
  activeTab,
  sectionKey,
  expandedSections,
  setExpandedSections,
  onTaskClick,
}) {
  const [showAll, setShowAll] = useState(false)
  const isExpanded = expandedSections[sectionKey] ?? tasks.length > 0
  const visibleTasks = showAll ? tasks : tasks.slice(0, 5)

  const toggleExpanded = () => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !isExpanded,
    }))
  }

  return (
    <section className="w-full">
      <button
        type="button"
        onClick={toggleExpanded}
        className="flex w-full items-center justify-between gap-5 py-4 text-left"
      >
        <h2 className="text-[26px] font-normal tracking-[-0.02em] text-slate-900 max-sm:text-[22px]">
          {label}
        </h2>

        <div className="flex items-center gap-5">
          <span
            className={`text-base font-medium ${
              tasks.length > 0 ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            {tasks.length}
          </span>

          <ChevronDown
            className={`h-6 w-6 text-slate-500 transition ${
              isExpanded ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </div>
      </button>

      {isExpanded ? (
        <div>
          {tasks.length > 0 ? (
            <>
              <div className="overflow-hidden">
                {visibleTasks.map((task, index) => (
                  <TaskRow
                    key={`${getTaskId(task)}-${index}`}
                    task={task}
                    activeTab={activeTab}
                    index={index}
                    onClick={() => onTaskClick(task)}
                  />
                ))}
              </div>

              {tasks.length > 5 ? (
                <div className="py-7 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAll((prev) => !prev)}
                    className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                  >
                    {showAll ? 'Tampilkan lebih sedikit' : 'Lihat semua'}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-[18px] border border-dashed border-slate-200 bg-white/70 px-5 py-8 text-center text-sm text-slate-400">
              Tidak ada tugas di bagian ini
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}

export default function ListOfTasksPage() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('assigned')
  const [tasksData, setTasksData] = useState(emptyTasks)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState('all')
  const [expandedSections, setExpandedSections] = useState({})

  const fetchTasks = async () => {
    try {
      setIsLoading(true)

      const res = await api.get('/assignments/my-tasks')
      setTasksData(res.data?.data || emptyTasks)
    } catch (error) {
      console.error('Failed to fetch my tasks:', error)
      setTasksData(emptyTasks)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const allTasksFlat = useMemo(() => {
    const result = []

    Object.values(tasksData).forEach((tabGroup) => {
      Object.values(tabGroup || {}).forEach((items) => {
        result.push(...(items || []))
      })
    })

    return result
  }, [tasksData])

  const classOptions = useMemo(() => {
    const classMap = new Map()

    allTasksFlat.forEach((task) => {
      const classId = getClassId(task)
      const className = getTaskClassName(task)

      if (classId && !classMap.has(String(classId))) {
        classMap.set(String(classId), className)
      }
    })

    return Array.from(classMap.entries()).map(([value, label]) => ({
      value,
      label,
    }))
  }, [allTasksFlat])

  const filteredTasksData = useMemo(() => {
    if (selectedClass === 'all') return tasksData

    const next = structuredClone(tasksData)

    Object.keys(next).forEach((tabKey) => {
      Object.keys(next[tabKey]).forEach((sectionKey) => {
        next[tabKey][sectionKey] = next[tabKey][sectionKey].filter(
          (task) => String(getClassId(task)) === String(selectedClass),
        )
      })
    })

    return next
  }, [tasksData, selectedClass])

  const activeSections = sectionConfig[activeTab]
  const activeData = filteredTasksData[activeTab] || {}

  const handleTaskClick = (task) => {
    const taskId = getTaskId(task)
    const classId = getClassId(task)

    if (!taskId || !classId) return

    navigate(`/classes/${classId}/assignments/${taskId}/detail`)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-black/10 bg-[#f5f7fb] px-6 pt-6">
        <h1 className="text-[28px] font-normal tracking-[-0.02em] text-slate-900">
          Daftar tugas
        </h1>

        <div className="mt-4 flex items-center gap-7 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key)
                  setExpandedSections({})
                }}
                className={`relative px-4 py-4 text-sm font-semibold transition ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}

                {isActive ? (
                  <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-full bg-blue-600" />
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[920px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-8">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-16 w-full max-w-[420px] rounded-[4px] border border-slate-500 bg-white px-5 text-lg text-slate-800 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">Semua kelas</option>
            {classOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-[18px] bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {activeSections.map((section) => (
              <TaskSection
                key={`${activeTab}-${section.key}`}
                label={section.label}
                tasks={activeData[section.key] || []}
                activeTab={activeTab}
                sectionKey={`${activeTab}-${section.key}`}
                expandedSections={expandedSections}
                setExpandedSections={setExpandedSections}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
