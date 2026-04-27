import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Header({ isSidebarCollapsed, setIsSidebarCollapsed }) {
  const navLeftPadding = isSidebarCollapsed ? 'pl-34' : 'pl-64'
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const dropdownRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const displayName =
    user?.displayNamePreference === 'nickname' && user?.nickname
      ? user.nickname
      : user?.displayNamePreference === 'username' && user?.username
        ? user.username
        : user?.fullName || 'Profile'

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navItems = [
    { label: 'Classes', path: '/home' },
    { label: 'Forum', path: '/forum' },
  ]

  return (
    <header className="fixed left-0 right-0 top-0 z-50 w-full bg-[#F3EDED] px-6 pt-4 shadow-sm">
      {' '}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-black/5 transition"
          >
            <div className="flex flex-col gap-[4px]">
              <span className="block h-[2px] w-5 bg-black rounded-full" />
              <span className="block h-[2px] w-5 bg-black rounded-full" />
              <span className="block h-[2px] w-5 bg-black rounded-full" />
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
              <span className="text-black font-semibold">Class</span>
              <span className="ml-1 rounded bg-[#F5A300] px-1.5 py-0.5 text-black font-semibold">
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
            )}
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
        className={`mt-4 flex items-center gap-8 pb-4 transition-all duration-300 ${navLeftPadding}`}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative text-[16px] transition ${
                isActive
                  ? 'font-semibold text-black'
                  : 'text-black/80 hover:text-black'
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute -bottom-1 left-0 h-[2px] w-full rounded-full bg-black" />
              )}
            </Link>
          )
        })}
      </div>
    </header>
  )
}
