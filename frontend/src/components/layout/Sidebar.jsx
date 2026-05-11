import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { House, CalendarDays, FolderOpen } from 'lucide-react'
import {
  getMyClasses,
  transformGroupedClassesToCards,
} from '../../services/classService'

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

export default function Sidebar({ isCollapsed }) {
  const [isAssignedOpen, setIsAssignedOpen] = useState(true)
  const [classes, setClasses] = useState([])
  const location = useLocation()
  const { user } = useAuth()

  const isTeacher = user?.role === 'teacher'
  const canSeeAssigned = !isTeacher

  const mainItems = [
    { label: 'Home', path: '/home', icon: House },
    { label: 'Calendar', path: '/calendar', icon: CalendarDays },
  ]

  useEffect(() => {
    const fetchSidebarClasses = async () => {
      try {
        const grouped = await getMyClasses()
        const transformed = transformGroupedClassesToCards(grouped)
        setClasses(transformed)
      } catch (error) {
        console.error('Failed to fetch sidebar classes:', error)
        setClasses([])
      }
    }

    fetchSidebarClasses()
  }, [])

  const sidebarClasses = useMemo(() => classes.slice(0, 8), [classes])

  return (
    <aside
      className={`fixed left-0 top-[100px] z-40 h-[calc(100vh-100px)] overflow-y-auto bg-[#F3EDED] transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-[84px]' : 'w-[190px]'
      }`}
    >
      <div className="px-4 pt-5 pb-4">
        <div className="flex flex-col gap-2">
          {mainItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex min-h-[44px] items-center rounded-xl px-3 py-2 transition ${
                  isActive
                    ? 'bg-black/10 font-medium shadow-sm'
                    : 'hover:bg-black/5'
                } ${isCollapsed ? 'justify-center' : 'gap-4'}`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive ? 'text-black' : 'text-black/75'
                  }`}
                />

                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                    isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>

        {canSeeAssigned ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsAssignedOpen((prev) => !prev)}
              className={`flex min-h-[44px] w-full items-center rounded-xl px-3 py-2 transition hover:bg-black/5 ${
                isCollapsed ? 'justify-center' : 'justify-between'
              }`}
            >
              <div
                className={`flex items-center ${isCollapsed ? '' : 'gap-4'}`}
              >
                <FolderOpen className="h-5 w-5 shrink-0 text-black" />

                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                    isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                  }`}
                >
                  Assigned
                </span>
              </div>

              {!isCollapsed && (
                <span
                  className={`flex h-4 w-4 items-center justify-center transition-transform duration-300 ${
                    isAssignedOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                >
                  <span className="block h-2 w-2 rotate-45 border-b-[1.5px] border-r-[1.5px] border-black/70" />
                </span>
              )}
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isCollapsed
                  ? 'max-h-0 opacity-0'
                  : isAssignedOpen
                    ? 'mt-2 max-h-[420px] opacity-100'
                    : 'max-h-0 opacity-0'
              }`}
            >
              <div className="ml-3 flex flex-col gap-2">
                <Link
                  to="/tasks"
                  className="rounded-xl px-3 py-2 text-sm transition hover:bg-black/5"
                >
                  List of tasks
                </Link>

                {sidebarClasses.length > 0 ? (
                  sidebarClasses.map((cls) => {
                    const isActive = location.pathname.startsWith(
                      `/classes/${cls._id}`,
                    )

                    const className =
                      cls.title || cls.subject || 'Untitled Class'
                    const teacherAvatar = buildAvatarUrl(cls.teacher?.avatar)

                    return (
                      <Link
                        key={cls._id}
                        to={`/classes/${cls._id}`}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                          isActive
                            ? 'bg-black/10 font-medium'
                            : 'hover:bg-black/5'
                        }`}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#CFCFCF] text-[11px] font-semibold text-black/70">
                          {teacherAvatar ? (
                            <img
                              src={teacherAvatar}
                              alt={className}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            className.charAt(0).toUpperCase()
                          )}
                        </span>

                        <span className="truncate">{className}</span>
                      </Link>
                    )
                  })
                ) : (
                  <p className="px-3 py-2 text-xs text-black/40">
                    No classes yet
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
