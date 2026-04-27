import { useEffect, useMemo, useState } from 'react'
import { Search, ChevronDown, Sparkles } from 'lucide-react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'

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

function AchievementBadges({ badges = [], size = 'md' }) {
  const badgeSize =
    size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-7 w-7 text-[11px]'

  if (!badges.length) {
    return null
  }

  return (
    <div className="mt-2 flex items-center justify-center gap-1.5">
      {badges.slice(0, 2).map((badge) => (
        <div
          key={badge._id}
          title={badge.title}
          className={`flex ${badgeSize} items-center justify-center rounded-full bg-[#8c79eb] font-semibold text-white shadow-sm ring-2 ring-white`}
        >
          {badge.icon || badge.title?.charAt(0)?.toUpperCase() || 'A'}
        </div>
      ))}
    </div>
  )
}

function PodiumCard({ student, position }) {
  const config =
    position === 1
      ? {
          columnHeight: 'h-[170px]',
          columnColor:
            'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500',
          avatarSize: 'h-[108px] w-[108px]',
          ring: 'ring-4 ring-amber-200',
          badge: 'bg-amber-100 text-amber-700',
        }
      : position === 2
        ? {
            columnHeight: 'h-[132px]',
            columnColor:
              'bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500',
            avatarSize: 'h-[94px] w-[94px]',
            ring: 'ring-4 ring-slate-200',
            badge: 'bg-slate-100 text-slate-700',
          }
        : {
            columnHeight: 'h-[102px]',
            columnColor:
              'bg-gradient-to-b from-orange-300 via-orange-400 to-orange-500',
            avatarSize: 'h-[94px] w-[94px]',
            ring: 'ring-4 ring-orange-200',
            badge: 'bg-orange-100 text-orange-700',
          }

  const avatarUrl = buildAvatarUrl(student?.avatar)

  if (!student) {
    return (
      <div className="flex w-[170px] flex-col items-center justify-end">
        <div className="h-[96px] w-[96px] rounded-full bg-slate-200" />
        <div className="mt-4 h-5 w-24 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-16 rounded bg-slate-200" />
        <div
          className={`mt-5 w-[126px] rounded-t-[22px] bg-slate-200 ${config.columnHeight}`}
        />
      </div>
    )
  }

  return (
    <div className="flex w-[170px] flex-col items-center justify-end">
      <div
        className={`flex ${config.avatarSize} items-center justify-center overflow-hidden rounded-full bg-white shadow-lg ${config.ring}`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={student.displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-2xl font-semibold text-slate-600">
            {(student.displayName || '?').charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <AchievementBadges badges={student.showcaseAchievements || []} />

      <div className="mt-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase text-slate-700 bg-white shadow-sm">
        Rank #{position}
      </div>

      <p className="mt-3 max-w-[145px] text-center text-[18px] font-semibold leading-snug text-slate-900">
        {student.displayName}
      </p>

      <p className="mt-1 text-[16px] font-medium text-slate-600">
        {student.points} pts
      </p>

      <div
        className={`mt-5 flex w-[126px] items-end justify-center rounded-t-[22px] shadow-md ${config.columnColor} ${config.columnHeight}`}
      >
        <span className="pb-3 text-[44px] font-bold leading-none text-white/95">
          {position}
        </span>
      </div>
    </div>
  )
}

function LeaderboardRow({ student }) {
  const avatarUrl = buildAvatarUrl(student.avatar)
  return (
    <div className="group flex items-center rounded-[22px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="h-[86px] w-[6px] rounded-l-[22px] bg-gradient-to-b from-violet-500 to-indigo-500" />

      <div className="flex min-h-[86px] flex-1 items-center gap-5 px-6">
        <div className="w-[42px] shrink-0 text-[24px] font-semibold text-slate-700">
          {student.rank}
        </div>

        <div className="flex shrink-0 flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-200 to-slate-300 ring-2 ring-white shadow-sm">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={student.displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-slate-600">
                {(student.displayName || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <AchievementBadges
            badges={student.showcaseAchievements || []}
            size="sm"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[18px] font-semibold text-slate-900">
            {student.displayName}
          </p>
          <p className="mt-1 text-[14px] text-slate-500">
            Level {student.level} • XP {student.xp}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[24px] font-semibold text-slate-900">
            {student.points}
          </p>
          <p className="text-[13px] uppercase tracking-wide text-slate-400">
            points
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ClassLeaderboardPage() {
  const { classId } = useParams()

  const [leaderboardData, setLeaderboardData] = useState({
    podium: [],
    others: [],
  })
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')
  const [isLoading, setIsLoading] = useState(true)

  const fetchLeaderboard = async ({
    searchValue = search,
    orderValue = sortOrder,
  } = {}) => {
    try {
      setIsLoading(true)

      const res = await api.get(`/classes/${classId}/leaderboard`, {
        params: {
          search: searchValue,
          order: orderValue,
        },
      })

      console.log('LEADERBOARD DATA:', res.data?.data)

      setLeaderboardData({
        podium: res.data?.data?.podium || [],
        others: res.data?.data?.others || [],
      })
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
      toast.error(error.response?.data?.message || 'Failed to load leaderboard')
      setLeaderboardData({
        podium: [],
        others: [],
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [classId])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchLeaderboard({
        searchValue: search,
        orderValue: sortOrder,
      })
    }, 350)

    return () => clearTimeout(timeout)
  }, [search, sortOrder])

  const podiumByPosition = useMemo(() => {
    const second =
      leaderboardData.podium.find((item) => item.rank === 2) || null
    const first = leaderboardData.podium.find((item) => item.rank === 1) || null
    const third = leaderboardData.podium.find((item) => item.rank === 3) || null

    return { first, second, third }
  }, [leaderboardData])

  if (isLoading) {
    return (
      <div className="px-6 py-6">
        <div className="mt-2 rounded-[32px] border border-violet-100 bg-gradient-to-br from-[#fcfbff] via-[#f8f5ff] to-[#f2f7ff] px-8 pt-8 pb-10 shadow-[0_20px_60px_rgba(124,58,237,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="h-10 w-56 rounded-xl bg-violet-100" />
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-[56px] w-[320px] items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-5 shadow-sm">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student..."
                  className="w-full bg-transparent text-[16px] text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="h-[56px] min-w-[220px] appearance-none rounded-[18px] border border-slate-200 bg-white px-5 pr-12 text-[16px] text-slate-800 shadow-sm outline-none"
                >
                  <option value="desc">Highest to Lowest</option>
                  <option value="asc">Lowest to Highest</option>
                </select>

                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-wrap items-end justify-center gap-10">
            <PodiumCard position={2} />
            <PodiumCard position={1} />
            <PodiumCard position={3} />
          </div>

          <div className="mx-auto mt-12 flex max-w-[980px] flex-col gap-5">
            <div className="h-[86px] rounded-[22px] bg-white" />
            <div className="h-[86px] rounded-[22px] bg-white" />
            <div className="h-[86px] rounded-[22px] bg-white" />
          </div>
        </div>
      </div>
    )
  }

  const hasAnyData =
    leaderboardData.podium.length > 0 || leaderboardData.others.length > 0

  return (
    <div className="px-6 py-6">
      <div className="mt-2 rounded-[32px] border border-violet-100 bg-gradient-to-br from-[#fcfbff] via-[#f8f5ff] to-[#f2f7ff] px-8 pt-8 pb-10 shadow-[0_20px_60px_rgba(124,58,237,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-medium text-violet-700">
              <Sparkles className="h-4 w-4" />
              Leaderboard
            </div>

            <h1 className="text-[38px] font-semibold tracking-[-0.02em] leading-none text-slate-900">
              Class Ranking
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-[56px] w-[360px] items-center gap-3 rounded-[18px] bg-[#F1F1F1] px-5">
              <Search className="h-5 w-5 text-black/45" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student..."
                className="w-full bg-transparent text-[18px] text-black outline-none placeholder:text-black/35"
              />
            </div>

            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="h-[56px] min-w-[250px] appearance-none rounded-[18px] border border-black/18 bg-white px-6 pr-12 text-[18px] text-black outline-none"
              >
                <option value="desc">Highest to Lowest</option>
                <option value="asc">Lowest to Highest</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
            </div>
          </div>
        </div>

        {!hasAnyData ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/80 px-8 py-10 text-center shadow-sm">
              <p className="text-[20px] font-medium text-slate-700">
                No leaderboard data found
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Try another search or wait until scores are returned.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-14 flex flex-wrap items-end justify-center gap-8 lg:gap-10">
              <PodiumCard student={podiumByPosition.second} position={2} />
              <PodiumCard student={podiumByPosition.first} position={1} />
              <PodiumCard student={podiumByPosition.third} position={3} />
            </div>

            <div className="mx-auto mt-12 flex max-w-[980px] flex-col gap-5">
              {leaderboardData.others.length > 0 ? (
                leaderboardData.others.map((student) => (
                  <LeaderboardRow key={student._id} student={student} />
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-slate-200 bg-white px-6 py-8 text-center text-[16px] text-slate-500 shadow-sm">
                  No students outside the podium
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
