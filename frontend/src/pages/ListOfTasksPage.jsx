import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Filter,
  Search,
  Sparkles,
} from 'lucide-react'
import api from '../services/api'

const tabs = [
  {
    key: 'assigned',
    label: 'Assigned',
    description: 'Tasks you still need to work on.',
  },
  {
    key: 'notSubmitted',
    label: 'Missing',
    description: 'Tasks that passed the deadline.',
  },
  {
    key: 'completed',
    label: 'Completed',
    description: 'Tasks you have submitted.',
  },
]

const sectionConfig = {
  assigned: [
    { key: 'noDueDate', label: 'No due date' },
    { key: 'thisWeek', label: 'This week' },
    { key: 'nextWeek', label: 'Next week' },
    { key: 'later', label: 'Later' },
  ],
  notSubmitted: [
    { key: 'thisWeek', label: 'This week' },
    { key: 'lastWeek', label: 'Last week' },
    { key: 'earlier', label: 'Earlier' },
  ],
  completed: [
    { key: 'noDueDate', label: 'No due date' },
    { key: 'completedEarly', label: 'Completed early' },
    { key: 'thisWeek', label: 'This week' },
    { key: 'lastWeek', label: 'Last week' },
    { key: 'earlier', label: 'Earlier' },
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

  return new Date(value).toLocaleDateString('en-GB', {
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
      ? `Submitted ${formatDate(task.submittedAt)}`
      : 'Submitted'
  }

  if (activeTab === 'notSubmitted') {
    return task.dueDate
      ? `Due ${formatDate(task.dueDate)}`
      : task.statusText || 'Missing'
  }

  if (task.dueDate) {
    return `Due ${formatDate(task.dueDate)}`
  }

  if (task.assignedAt || task.createdAt) {
    return `Posted ${formatDate(task.assignedAt || task.createdAt)}`
  }

  return task.statusText || 'No due date'
}

function getTaskTone(activeTab, index) {
  if (activeTab === 'completed') {
    return {
      Icon: CheckCircle2,
      iconClass: 'bg-emerald-100 text-emerald-600',
      badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
      badgeText: 'Completed',
    }
  }

  if (activeTab === 'notSubmitted') {
    return {
      Icon: AlertCircle,
      iconClass: 'bg-rose-100 text-rose-600',
      badgeClass: 'bg-rose-50 text-rose-700 ring-rose-100',
      badgeText: 'Missing',
    }
  }

  const tones = [
    {
      iconClass: 'bg-violet-100 text-violet-700',
      badgeClass: 'bg-violet-50 text-violet-700 ring-violet-100',
    },
    {
      iconClass: 'bg-sky-100 text-sky-700',
      badgeClass: 'bg-sky-50 text-sky-700 ring-sky-100',
    },
    {
      iconClass: 'bg-indigo-100 text-indigo-700',
      badgeClass: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    },
    {
      iconClass: 'bg-amber-100 text-amber-700',
      badgeClass: 'bg-amber-50 text-amber-700 ring-amber-100',
    },
  ]

  return {
    Icon: ClipboardList,
    iconClass: tones[index % tones.length].iconClass,
    badgeClass: tones[index % tones.length].badgeClass,
    badgeText: 'Assigned',
  }
}

function countTasksInTab(tabData = {}) {
  return Object.values(tabData).reduce(
    (total, items) => total + (items?.length || 0),
    0,
  )
}

function TaskRow({ task, activeTab, index, onClick }) {
  const { Icon, iconClass, badgeClass, badgeText } = getTaskTone(
    activeTab,
    index,
  )

  return (
    <button
      type="button"
      onClick={onClick}
      className="group grid w-full grid-cols-[56px_minmax(0,1fr)_220px] items-center gap-4 rounded-[20px] border border-black/5 bg-white px-4 py-4 text-left shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_18px_42px_rgba(109,40,217,0.10)] max-md:grid-cols-[48px_minmax(0,1fr)]"
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl transition group-hover:scale-105 ${iconClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="truncate text-[15px] font-semibold text-slate-900">
            {getTaskTitle(task)}
          </p>

          <span
            className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeClass}`}
          >
            {badgeText}
          </span>
        </div>

        <p className="mt-1 truncate text-sm text-slate-500">
          {getTaskClassName(task)}
        </p>

        {activeTab === 'assigned' && (task.assignedAt || task.createdAt) ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <Clock3 className="h-3.5 w-3.5" />
            Posted {formatDate(task.assignedAt || task.createdAt)}
          </p>
        ) : null}
      </div>

      <div className="text-right text-sm text-slate-500 max-md:col-span-2 max-md:pl-[64px] max-md:text-left">
        <p className="font-medium text-slate-700">
          {getTaskDateText(task, activeTab)}
        </p>

        {activeTab === 'notSubmitted' ? (
          <p className="mt-1 text-xs italic text-rose-500">Not submitted</p>
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
    <section className="rounded-[28px] border border-black/5 bg-white/65 p-4 shadow-[0_16px_42px_rgba(15,23,42,0.04)] backdrop-blur sm:p-5">
      <button
        type="button"
        onClick={toggleExpanded}
        className="flex w-full items-center justify-between gap-5 text-left"
      >
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900 sm:text-[24px]">
            {label}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              tasks.length > 0
                ? 'bg-violet-50 text-violet-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {tasks.length}
          </span>

          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
            <ChevronDown
              className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </span>
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ${
          isExpanded
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-5 space-y-3">
            {tasks.length > 0 ? (
              <>
                {visibleTasks.map((task, index) => (
                  <TaskRow
                    key={`${getTaskId(task)}-${index}`}
                    task={task}
                    activeTab={activeTab}
                    index={index}
                    onClick={() => onTaskClick(task)}
                  />
                ))}

                {tasks.length > 5 ? (
                  <div className="pt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAll((prev) => !prev)}
                      className="rounded-full bg-violet-50 px-5 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                    >
                      {showAll ? 'Show less' : 'View all'}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/70 px-5 py-8 text-center">
                <p className="text-sm font-medium text-slate-500">
                  No tasks in this section
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Everything is clear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function ListOfTasksPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const isTeacher = user?.role === 'teacher'
  const isAuthReady = !!user?.role

  const [activeTab, setActiveTab] = useState('assigned')
  const [tasksData, setTasksData] = useState(emptyTasks)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState({})

  const fetchTasks = async () => {
    try {
      setIsLoading(true)

      const res = await api.get('/assignments/my-tasks')
      setTasksData(res.data?.data || emptyTasks)
    } catch (error) {
      if (error.response?.status === 403) {
        navigate('/home', { replace: true })
        return
      }
      console.error('Failed to fetch my tasks:', error)
      setTasksData(emptyTasks)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthReady) return

    if (isTeacher) {
      navigate('/home', { replace: true })
      return
    }

    fetchTasks()
  }, [isAuthReady, isTeacher, navigate])

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
    const query = searchQuery.trim().toLowerCase()

    const next = {
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

    Object.keys(tasksData).forEach((tabKey) => {
      Object.keys(tasksData[tabKey]).forEach((sectionKey) => {
        next[tabKey][sectionKey] = tasksData[tabKey][sectionKey].filter(
          (task) => {
            const classMatch =
              selectedClass === 'all' ||
              String(getClassId(task)) === String(selectedClass)

            const textMatch =
              !query ||
              getTaskTitle(task).toLowerCase().includes(query) ||
              getTaskClassName(task).toLowerCase().includes(query)

            return classMatch && textMatch
          },
        )
      })
    })

    return next
  }, [tasksData, selectedClass, searchQuery])

  const tabCounts = useMemo(
    () => ({
      assigned: countTasksInTab(filteredTasksData.assigned),
      notSubmitted: countTasksInTab(filteredTasksData.notSubmitted),
      completed: countTasksInTab(filteredTasksData.completed),
    }),
    [filteredTasksData],
  )

  const activeSections = sectionConfig[activeTab]
  const activeData = filteredTasksData[activeTab] || {}
  const activeTabMeta = tabs.find((tab) => tab.key === activeTab)

  const totalFilteredTasks =
    tabCounts.assigned + tabCounts.notSubmitted + tabCounts.completed

  const handleTaskClick = (task) => {
    const taskId = getTaskId(task)
    const classId = getClassId(task)

    if (!taskId || !classId) return

    navigate(`/classes/${classId}/assignments/${taskId}/detail`)
  }

  if (!isAuthReady || isTeacher) {
    return null
  }

  return (
    <div className="min-h-screen px-3 py-4 sm:px-6 sm:py-6">
      <div className="overflow-hidden rounded-[34px] border border-violet-100 bg-gradient-to-br from-[#fcfbff] via-[#f8f5ff] to-[#f2f7ff] shadow-[0_20px_60px_rgba(124,58,237,0.08)]">
        <div className="border-b border-white/70 px-5 pb-5 pt-6 sm:px-8 sm:pt-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm ring-1 ring-violet-100">
                <Sparkles className="h-3.5 w-3.5" />
                Task Center
              </div>

              <h1 className="text-[32px] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[40px]">
                List of Tasks
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Track your assignments, missing submissions, and completed work
                in one organized place.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-[24px] bg-white/70 p-3 shadow-sm ring-1 ring-black/5">
              <div className="text-center">
                <p className="text-xl font-semibold text-slate-900">
                  {tabCounts.assigned}
                </p>
                <p className="text-xs text-slate-400">Assigned</p>
              </div>

              <div className="text-center">
                <p className="text-xl font-semibold text-rose-600">
                  {tabCounts.notSubmitted}
                </p>
                <p className="text-xs text-slate-400">Missing</p>
              </div>

              <div className="text-center">
                <p className="text-xl font-semibold text-emerald-600">
                  {tabCounts.completed}
                </p>
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto rounded-[22px] bg-white/75 p-2 ring-1 ring-black/5">
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
                    className={`relative whitespace-nowrap rounded-[16px] px-5 py-3 text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? 'bg-violet-600 text-white shadow-[0_12px_28px_rgba(109,40,217,0.22)]'
                        : 'text-slate-500 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    {tab.label}

                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {tabCounts[tab.key]}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="h-12 w-full rounded-[18px] border border-black/5 bg-white/85 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-violet-200 focus:ring-4 focus:ring-violet-100 sm:w-[260px]"
                />
              </div>

              <div className="relative">
                <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="h-12 w-full appearance-none rounded-[18px] border border-black/5 bg-white/85 pl-11 pr-10 text-sm text-slate-700 outline-none transition focus:border-violet-200 focus:ring-4 focus:ring-violet-100 sm:w-[240px]"
                >
                  <option value="all">All classes</option>
                  {classOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="mb-6 rounded-[26px] border border-white/70 bg-white/55 px-5 py-4">
            <p className="text-sm font-semibold text-slate-900">
              {activeTabMeta?.label}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {activeTabMeta?.description}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-[24px] bg-white/70"
                />
              ))}
            </div>
          ) : totalFilteredTasks === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[30px] border border-dashed border-violet-100 bg-white/60 px-6 py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-600">
                <ClipboardList className="h-8 w-8" />
              </div>

              <h2 className="text-xl font-semibold text-slate-900">
                No tasks found
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Try changing the selected class or search keyword.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
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
    </div>
  )
}
