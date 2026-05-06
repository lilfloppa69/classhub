import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Trophy,
  Target,
  Star,
  Sparkles,
  Medal,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import api from '../services/api'
import MyProfileLayout from '../layouts/MyProfileLayout'
import AchievementDetailModal from '../components/my-profile/AchievementDetailModal'
import LevelProgressModal from '../components/my-profile/LevelProgressModal'

const levelTitles = [
  'Starter',
  'Learner',
  'Contributor',
  'Practitioner',
  'Associate',
  'Specialist',
  'Professional',
  'Advanced Professional',
  'Senior Professional',
  'Expert',
  'Advisor',
  'Strategist',
  'Leader',
  'Innovator',
  'Architect',
  'Authority',
  'Distinguished Expert',
  'Master',
  'Elite Master',
  'Grand Authority',
]

function getBadgesMemeText(count, total) {
  if (count === 0) return `bro is still in the tutorial (${count}/${total})`
  if (count < 3) return `starting to cook (${count}/${total})`
  if (count < 6) return `lowkey grinding (${count}/${total})`
  if (count < total) return `collecting Ws (${count}/${total})`
  return `full achievement goblin mode (${count}/${total})`
}

function getAchievementTypeLabel(type) {
  return type === 'class' ? 'Class Achievement' : 'System Achievement'
}

function getLeaderboardRows(rows = []) {
  if (!rows.length) return []

  const youRow = rows.find((row) => row.isYou)
  const topFive = rows.slice(0, 5)

  if (youRow && youRow.rank <= 5) return topFive
  if (youRow) return [...rows.slice(0, 4), youRow]

  return topFive
}

function getProgressPercent(levelProgress = {}) {
  const backendPercent = Number(levelProgress.progressPercent)

  if (!Number.isNaN(backendPercent) && backendPercent > 0) {
    return Math.min(Math.max(backendPercent, 0), 100)
  }

  const progressXp = Number(levelProgress.progressXp || 0)
  const progressNeeded = Number(levelProgress.progressNeeded || 0)

  if (progressXp > 0 && progressNeeded > 0) {
    return Math.min(Math.max((progressXp / progressNeeded) * 100, 0), 100)
  }

  const xp = Number(levelProgress.xp || 0)
  const currentLevelBaseXp = Number(levelProgress.currentLevelBaseXp || 0)
  const nextLevelXp = Number(levelProgress.nextLevelXp || 0)

  const levelRange = nextLevelXp - currentLevelBaseXp

  if (xp > 0 && levelRange > 0) {
    return Math.min(Math.max((xp / levelRange) * 100, 0), 100)
  }

  return 0
}

function getProgressDisplay(levelProgress = {}) {
  const progressXp = Number(levelProgress.progressXp || 0)
  const progressNeeded = Number(levelProgress.progressNeeded || 0)

  if (progressXp > 0 && progressNeeded > 0) {
    return {
      current: progressXp,
      needed: progressNeeded,
    }
  }

  const xp = Number(levelProgress.xp || 0)
  const currentLevelBaseXp = Number(levelProgress.currentLevelBaseXp || 0)
  const nextLevelXp = Number(levelProgress.nextLevelXp || 0)

  const levelRange = nextLevelXp - currentLevelBaseXp

  if (levelRange > 0) {
    return {
      current: xp,
      needed: levelRange,
    }
  }

  return {
    current: 0,
    needed: 1000,
  }
}

function getProgressWidth(percent) {
  const safe = Number(percent) || 0
  if (safe < 0) return 0
  if (safe > 100) return 100
  return safe
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white sm:text-xl">{title}</h3>
        {subtitle ? (
          <p className="mt-1 text-sm text-white/70">{subtitle}</p>
        ) : null}
      </div>
    </div>
  )
}

function OverviewStatCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-sm transition duration-200 hover:bg-white/15">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white/75">{label}</p>
          <p className="mt-3 text-3xl font-bold leading-none text-white sm:text-[40px]">
            {value}
          </p>
          <p className="mt-3 text-sm text-white/65">{helper}</p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function ShowcaseAchievementPill({ achievement, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={achievement.title}
      className="group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/15 text-sm font-semibold text-white backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white/25"
    >
      <span className="relative z-10">
        {achievement.title?.charAt(0)?.toUpperCase() || 'A'}
      </span>
      <span className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-white/10" />
    </button>
  )
}

function AchievementCard({ achievement, onClick }) {
  const isLocked = !achievement.isUnlocked

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${
        isLocked ? 'opacity-65' : ''
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#6b57d8] via-[#8f7cf6] to-[#69b2e2]" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-lg font-semibold text-slate-700 transition group-hover:scale-105">
          {achievement.title?.charAt(0)?.toUpperCase() || 'A'}
        </div>

        {isLocked ? (
          <div className="rounded-full bg-slate-900/85 p-1.5 text-white shadow-sm">
            <Lock className="h-3.5 w-3.5" />
          </div>
        ) : (
          <div className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            Unlocked
          </div>
        )}
      </div>

      <p className="mt-4 line-clamp-2 text-sm font-semibold text-slate-900">
        {achievement.title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {getAchievementTypeLabel(achievement.type)}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">
          Tap to view details
        </span>
        <Sparkles className="h-4 w-4 text-slate-300 transition group-hover:text-violet-500" />
      </div>
    </button>
  )
}

function LeaderboardRow({ row }) {
  const rowClass = row.isYou
    ? 'bg-gradient-to-r from-[#5f5af0] to-[#7b76ff] text-white shadow-md'
    : 'bg-white/35 text-slate-900'

  return (
    <div
      className={`flex items-center justify-between rounded-[18px] px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4 ${rowClass}`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/10 text-sm font-semibold">
          {row.rank}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold sm:text-[15px]">
            {row.displayName}
            {row.isYou ? ' (YOU)' : ''}
          </p>
          <p className="text-xs opacity-75">
            {row.isYou ? 'You are here' : 'Leaderboard participant'}
          </p>
        </div>
      </div>

      <div className="ml-4 shrink-0 text-right">
        <p className="text-sm font-semibold sm:text-[15px]">
          {row.points || 0} pts
        </p>
      </div>
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="rounded-[22px] border border-dashed border-white/20 bg-white/10 px-5 py-10 text-center text-sm text-white/70">
      {text}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <MyProfileLayout>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[30px] bg-[#a1a3bf] p-5 sm:p-6 lg:p-8">
          <div className="h-8 w-40 rounded-xl bg-white/20 animate-pulse" />

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-36 rounded-[24px] bg-white/15 animate-pulse"
              />
            ))}
          </div>

          <div className="mt-6 h-72 rounded-[28px] bg-white/15 animate-pulse" />

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr]">
            <div className="h-[420px] rounded-[28px] bg-white/15 animate-pulse" />
            <div className="h-[420px] rounded-[28px] bg-white/15 animate-pulse" />
          </div>
        </div>
      </div>
    </MyProfileLayout>
  )
}

export default function MyProfileShowcasePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isTeacher = user?.role === 'teacher'

  const [isLoading, setIsLoading] = useState(true)
  const [showcase, setShowcase] = useState(null)
  const [selectedAchievement, setSelectedAchievement] = useState(null)
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false)
  const [isTogglingAchievement, setIsTogglingAchievement] = useState(false)
  const [leaderboardIndex, setLeaderboardIndex] = useState(0)

  useEffect(() => {
    if (isTeacher) {
      navigate('/my-profile/information', { replace: true })
    }
  }, [isTeacher, navigate])

  const fetchShowcase = async () => {
    if (isTeacher) return

    try {
      setIsLoading(true)
      const res = await api.get('/my-profile/showcase')
      setShowcase(res.data?.data || null)
    } catch (error) {
      console.error('Failed to fetch showcase:', error)
      toast.error(error.response?.data?.message || 'Failed to load showcase')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchShowcase()
  }, [])

  const overview = showcase?.overview || {}
  const levelProgress = showcase?.levelProgress || {}
  const computedProgressPercent = getProgressPercent(levelProgress)
  const progressDisplay = getProgressDisplay(levelProgress)
  const achievements = showcase?.achievements || []
  const leaderboardPreview = showcase?.leaderboardPreview || []
  const showcaseAchievements = showcase?.showcaseAchievements || []

  const totalAchievementCount = achievements.length
  const currentLeaderboard = leaderboardPreview[leaderboardIndex] || null

  const leaderboardRows = useMemo(
    () => getLeaderboardRows(currentLeaderboard?.leaderboard || []),
    [currentLeaderboard],
  )

  const handlePrevLeaderboard = () => {
    setLeaderboardIndex((prev) =>
      prev === 0 ? Math.max(leaderboardPreview.length - 1, 0) : prev - 1,
    )
  }

  const handleNextLeaderboard = () => {
    setLeaderboardIndex((prev) =>
      prev === leaderboardPreview.length - 1 ? 0 : prev + 1,
    )
  }

  const handleOpenAchievement = (achievement) => {
    setSelectedAchievement({
      ...achievement,
      isLocked: !achievement.isUnlocked,
    })
  }

  const handleToggleDisplayAchievement = async () => {
    if (!selectedAchievement?._id) return

    try {
      setIsTogglingAchievement(true)

      await api.patch(`/my-profile/showcase/${selectedAchievement._id}`)

      const nextDisplayed = !selectedAchievement.isDisplayed

      setSelectedAchievement((prev) =>
        prev
          ? {
              ...prev,
              isDisplayed: nextDisplayed,
            }
          : prev,
      )

      toast.success(
        nextDisplayed
          ? 'Achievement displayed successfully'
          : 'Achievement removed from display',
      )

      await fetchShowcase()
    } catch (error) {
      console.error('Failed to toggle showcase achievement:', error)
      toast.error(
        error.response?.data?.message ||
          'Failed to update displayed achievement',
      )
    } finally {
      setIsTogglingAchievement(false)
    }
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <MyProfileLayout>
      <section className="overflow-hidden rounded-[30px] bg-[#a1a3bf] p-5 text-white shadow-[0_18px_60px_rgba(76,85,122,0.18)] sm:p-6 lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/65">
              My Profile
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] sm:text-[30px]">
              Overview Dashboard
            </h2>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white/80">
            <Sparkles className="h-4 w-4" />
            Progress synced from your showcase data
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <OverviewStatCard
            icon={Target}
            label="Tasks Completed"
            value={overview.tasksCompleted || 0}
            helper="this week"
          />

          <OverviewStatCard
            icon={Star}
            label="Avg Score"
            value={`${overview.avgScore || 0} pts`}
            helper="Across all classes"
          />

          <OverviewStatCard
            icon={Medal}
            label="Badges Earned"
            value={overview.badgesEarned || 0}
            helper={getBadgesMemeText(
              overview.badgesEarned || 0,
              totalAchievementCount || 0,
            )}
          />
        </div>

        <button
          type="button"
          onClick={() => setIsLevelModalOpen(true)}
          className="mt-6 w-full overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-r from-[#6b57d8] via-[#6f79e8] to-[#69b2e2] p-5 text-left shadow-[0_16px_40px_rgba(70,70,180,0.22)] transition duration-200 hover:-translate-y-0.5 hover:brightness-[1.03] sm:p-6 lg:p-8"
        >
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#35afe4] text-3xl font-semibold text-black/80 shadow-sm">
                  {levelProgress.level || 1}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold sm:text-2xl">
                      {levelProgress.levelTitle || 'Starter'}
                    </h3>

                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/85">
                      Level {levelProgress.level || 1}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-medium text-black/85 sm:text-base">
                    Level {levelProgress.level || 1} out of 20
                  </p>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-black/80 sm:text-[15px]">
                    {levelProgress.xpRemaining || 0} XP to reach{' '}
                    {levelTitles[Math.min(levelProgress.level || 1, 19)] ||
                      'Next Level'}{' '}
                    (Lv {(levelProgress.level || 1) + 1})
                  </p>
                </div>
              </div>

              <div className="mt-6 w-full max-w-[620px]">
                <div className="mb-2 flex items-center justify-between gap-4 text-sm text-black/80">
                  <span>
                    {progressDisplay.current} / {progressDisplay.needed} XP
                  </span>
                  <span className="font-semibold">
                    {Math.round(computedProgressPercent)}%
                  </span>
                </div>

                <div className="h-4 w-full overflow-hidden rounded-full bg-white/25 backdrop-blur">
                  <div
                    className="h-full rounded-full bg-white shadow-[0_4px_12px_rgba(255,255,255,0.35)] transition-all duration-500"
                    style={{
                      width: `${computedProgressPercent}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5 xl:max-w-[360px] xl:items-end">
              <div className="w-full rounded-[22px] bg-white/12 p-4 text-left text-black/75 backdrop-blur xl:text-right">
                <p className="text-2xl font-semibold text-black/80 sm:text-[28px]">
                  {levelProgress.xp || 0} XP
                </p>
                <p className="mt-1 text-sm sm:text-base">
                  Next target: {levelProgress.nextLevelXp || 0} XP
                </p>
              </div>

              <div className="w-full">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/75 xl:text-right">
                  Displayed Achievements
                </p>

                <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                  {showcaseAchievements.length > 0 ? (
                    showcaseAchievements.map((achievement) => (
                      <ShowcaseAchievementPill
                        key={achievement._id}
                        achievement={achievement}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAchievement({
                            ...achievement,
                            isLocked: false,
                          })
                        }}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-black/70">
                      No displayed achievements yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </button>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.95fr]">
          <div className="rounded-[28px] bg-[#8c79eb] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)] sm:p-6">
            <SectionTitle
              icon={Trophy}
              title="Achievements"
              subtitle="Track unlocked milestones and inspect details"
            />

            <div className="max-h-[440px] overflow-y-auto pr-1">
              {achievements.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {achievements.map((achievement) => (
                    <AchievementCard
                      key={achievement._id}
                      achievement={achievement}
                      onClick={() => handleOpenAchievement(achievement)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState text="No achievements yet" />
              )}
            </div>
          </div>

          <div className="rounded-[28px] bg-[#7fb2e5] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)] sm:p-6">
            <SectionTitle
              icon={Medal}
              title="Leaderboards"
              subtitle="Preview top rankings across available classes"
            />

            <div className="max-h-[440px] overflow-y-auto pr-1">
              {currentLeaderboard ? (
                <>
                  <div className="mb-5 flex items-center justify-between gap-3 rounded-[20px] border border-white/15 bg-white/20 px-3 py-3 text-slate-900 backdrop-blur">
                    <button
                      type="button"
                      onClick={handlePrevLeaderboard}
                      aria-label="Previous leaderboard"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/35 transition hover:bg-white/55"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="min-w-0 flex-1 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700/80">
                        Current Class
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold uppercase tracking-wide sm:text-[15px]">
                        {currentLeaderboard.className}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleNextLeaderboard}
                      aria-label="Next leaderboard"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/35 transition hover:bg-white/55"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {leaderboardRows.map((row) => (
                      <LeaderboardRow
                        key={`${currentLeaderboard.classId}-${row.rank}-${row.displayName}`}
                        row={row}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState text="No leaderboard data yet" />
              )}
            </div>
          </div>
        </div>
      </section>

      <AchievementDetailModal
        isOpen={!!selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
        achievement={selectedAchievement}
        isLocked={selectedAchievement?.isLocked}
        canToggleDisplay={!selectedAchievement?.isLocked}
        isToggling={isTogglingAchievement}
        onToggleDisplay={handleToggleDisplayAchievement}
      />

      <LevelProgressModal
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        currentLevel={levelProgress.level || 1}
        currentXp={levelProgress.xp || 0}
        levelTitles={levelTitles}
      />
    </MyProfileLayout>
  )
}
