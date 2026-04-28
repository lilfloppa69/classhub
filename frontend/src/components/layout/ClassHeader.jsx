import { useRef, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  LayoutGrid,
  ClipboardList,
  Users,
  MessageSquareText,
  Trophy,
  GraduationCap,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function ClassHeader({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { classId } = useParams()
  const { user, logout } = useAuth()
  const [classData, setClassData] = useState(null)

  useEffect(() => {
    const fetchClassData = async () => {
      if (!classId) return

      try {
        const res = await api.get(`/classes/${classId}`)
        setClassData(res.data?.data || null)
      } catch (error) {
        console.error('Failed to fetch class header data:', error)
        setClassData(null)
      }
    }

    fetchClassData()
  }, [classId])

  const displayName =
    user?.displayNamePreference === 'nickname' && user?.nickname
      ? user.nickname
      : user?.displayNamePreference === 'username' && user?.username
        ? user.username
        : user?.fullName || 'Profile'

  const isTeacher =
    classData?.teacher?._id?.toString?.() === user?._id?.toString?.() ||
    classData?.teacher?.toString?.() === user?._id?.toString?.()

  const buildAvatarUrl = (avatar) => {
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

  const avatarUrl = buildAvatarUrl(user?.avatar)

  const navLeftPadding = isSidebarCollapsed ? 'pl-34' : 'pl-64'

  const classNavItems = [
    {
      key: 'class',
      label: 'Class',
      icon: LayoutGrid,
      path: `/classes/${classId}`,
      isActive:
        location.pathname === `/classes/${classId}` ||
        location.pathname === `/classes/${classId}/`,
    },
    {
      key: 'assignments',
      label: 'Assignments',
      icon: ClipboardList,
      path: `/classes/${classId}/assignments`,
      isActive: location.pathname === `/classes/${classId}/assignments`,
    },
    {
      key: 'students',
      label: 'Students',
      icon: Users,
      path: `/classes/${classId}/students`,
      isActive: location.pathname === `/classes/${classId}/students`,
    },
    {
      key: 'forum',
      label: 'Forum',
      icon: MessageSquareText,
      path: `/classes/${classId}/forum`,
      isActive:
        location.pathname === `/classes/${classId}/forum` ||
        location.pathname.startsWith(`/classes/${classId}/forum/`),
    },
    isTeacher
      ? {
          key: 'grades',
          label: 'Grades',
          icon: GraduationCap,
          path: `/classes/${classId}/grades`,
          isActive: location.pathname === `/classes/${classId}/grades`,
        }
      : null,
    {
      key: 'leaderboard',
      label: 'Leaderboard',
      icon: Trophy,
      path: `/classes/${classId}/leaderboard`,
      isActive: location.pathname === `/classes/${classId}/leaderboard`,
    },
  ].filter(Boolean)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 w-full bg-[#F3EDED] px-6 pt-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-black/5 transition"
          >
            <div className="flex flex-col gap-[4px]">
              <span className="block h-[2px] w-5 rounded-full bg-black" />
              <span className="block h-[2px] w-5 rounded-full bg-black" />
              <span className="block h-[2px] w-5 rounded-full bg-black" />
            </div>
          </button>

          <div className="flex items-center gap-3 cursor-pointer">
            <img
              src="/JaktViggen.svg"
              alt="JaktViggen"
              className="h-10 w-10 object-contain"
              onClick={() => navigate('/home')}
            />

            <div
              className="text-[20px] font-medium leading-none cursor-pointer"
              onClick={() => navigate('/home')}
            >
              <span className="font-semibold text-black">Class</span>
              <span className="ml-1 rounded bg-[#F5A300] px-1.5 py-0.5 font-semibold text-black">
                Hub
              </span>
            </div>
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center gap-4 rounded-full px-2 py-1 hover:bg-black/5 transition"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-11 w-11 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#CFCFCF] text-sm font-semibold text-black/70">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}{' '}
            <span className="text-[15px] text-black">{displayName}</span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg">
              <Link
                to="/my-profile/information"
                onClick={() => setIsProfileOpen(false)}
                className="block px-4 py-3 text-sm text-black hover:bg-gray-100 transition"
              >
                My Profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-gray-100 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className={`mt-4 flex items-center gap-10 pb-4 transition-all duration-300 ${navLeftPadding}`}
      >
        {classNavItems.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.key}
              to={item.path}
              className={`relative flex items-center gap-2 transition ${
                item.isActive
                  ? 'font-semibold text-black'
                  : 'text-black/75 hover:text-black'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.isActive && (
                <span className="absolute -bottom-1 left-0 h-[2px] w-full rounded-full bg-black" />
              )}
            </Link>
          )
        })}
      </div>
    </header>
  )
}
