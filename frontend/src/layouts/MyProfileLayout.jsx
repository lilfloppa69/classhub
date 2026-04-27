import { ArrowLeft } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

const tabs = [
  {
    label: 'Information',
    path: '/my-profile/information',
  },
  {
    label: 'Showcase',
    path: '/my-profile/showcase',
  },
  {
    label: 'My Account',
    path: '/my-profile/account',
  },
]

export default function MyProfileLayout({ children }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#F3EDED] px-6 py-6">
      <button
        type="button"
        onClick={() => navigate('/home')}
        className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-slate-800"
      >
        <ArrowLeft className="h-7 w-7" />
      </button>

      <div className="mx-auto w-full max-w-[1280px] overflow-hidden rounded-[28px] bg-[#F8F8F8] shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="bg-gradient-to-r from-[#bdd7f6] via-[#e9e3e7] to-[#efe8c6] px-12 pt-16 pb-0">
          <div className="flex flex-wrap items-end gap-6">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `rounded-t-[18px] px-8 py-4 text-[16px] font-medium transition ${
                    isActive
                      ? 'bg-[#4932c9] text-white shadow-[0_10px_30px_rgba(73,50,201,0.25)]'
                      : 'bg-[#8a84d8] text-white hover:bg-[#7d76d1]'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="px-8 py-8 md:px-10 md:py-10">{children}</div>
      </div>
    </div>
  )
}
