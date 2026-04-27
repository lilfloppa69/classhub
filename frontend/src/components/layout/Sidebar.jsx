import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { House, CalendarDays, FolderOpen } from 'lucide-react'

export default function Sidebar({ isCollapsed }) {
  const [isAssignedOpen, setIsAssignedOpen] = useState(true)
  const location = useLocation()

  const mainItems = [
    { label: 'Home', path: '/home', icon: House },
    { label: 'Calendar', path: '/calendar', icon: CalendarDays },
  ]

  const classItems = ['Class 1', 'Class 2', 'Class 3', 'Class 4']

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
                />{' '}
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

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setIsAssignedOpen((prev) => !prev)}
            className={`flex min-h-[44px] w-full items-center rounded-xl px-3 py-2 hover:bg-black/5 transition ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? '' : 'gap-4'}`}>
              <FolderOpen className="h-5 w-5 shrink-0 text-black" />{' '}
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
                  ? 'mt-2 max-h-[320px] opacity-100'
                  : 'max-h-0 opacity-0'
            }`}
          >
            <div className="ml-3 flex flex-col gap-2">
              <Link
                to="/assigned"
                className="rounded-xl px-3 py-2 text-sm hover:bg-black/5 transition"
              >
                List of tasks
              </Link>

              {classItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-black/5 transition"
                >
                  <span className="h-6 w-6 rounded-full bg-[#CFCFCF]" />
                  <span>{item}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
