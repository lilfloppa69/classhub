import { CheckCircle2, Lock, Sparkles, Trophy, X } from 'lucide-react'

function getAchievementTypeLabel(type) {
  return type === 'class' ? 'Class Achievement' : 'System Achievement'
}

function getHowToUnlock(achievement) {
  if (!achievement) return 'Complete the requirement for this achievement.'

  if (achievement.howToUnlock) {
    return achievement.howToUnlock
  }

  const triggerMap = {
    create_forum: 'Create forum posts',
    reply_forum: 'Reply to forum discussions',
    get_forum_upvote: 'Receive forum upvotes',
    submit_assignment: 'Submit assignments',
    create_assignment: 'Create assignments',
    evaluate_assignment: 'Evaluate student submissions',
  }

  const actionText =
    triggerMap[achievement.trigger] || 'Complete the requirement'

  if (achievement.conditionValue) {
    return `${actionText} until you reach ${achievement.conditionValue}.`
  }

  return actionText
}

function DetailBlock({ label, children }) {
  return (
    <div className="rounded-[18px] bg-slate-50 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="mt-2 text-sm leading-7 text-slate-700">{children}</div>
    </div>
  )
}

export default function ClassAchievementDetailModal({
  isOpen,
  onClose,
  achievement,
}) {
  if (!isOpen || !achievement) return null

  const isUnlocked = achievement.isUnlocked || achievement.isAchieved
  const iconText =
    achievement.icon || achievement.title?.charAt(0)?.toUpperCase() || 'A'

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-[540px] overflow-hidden rounded-[30px] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4 px-6 pb-5 pt-6">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-slate-900">
              Achievement Detail
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              View this class milestone and its rewards.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6">
          <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-violet-600 to-sky-500 p-6 text-white">
            <div className="absolute right-[-40px] top-[-48px] h-32 w-32 rounded-full bg-white/15" />
            <div className="absolute bottom-[-55px] left-[-45px] h-36 w-36 rounded-full bg-white/10" />

            <div className="relative z-10 flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl font-semibold">
                {iconText}
              </div>

              <div className="min-w-0">
                <h3 className="break-words text-[22px] font-semibold leading-tight">
                  {achievement.title || 'Untitled Achievement'}
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90">
                    {getAchievementTypeLabel(achievement.type)}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      isUnlocked
                        ? 'bg-emerald-300/20 text-emerald-50'
                        : 'bg-slate-900/25 text-white/80'
                    }`}
                  >
                    {isUnlocked ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" />
                    )}
                    {isUnlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <DetailBlock label="Status">
              <div className="flex items-center gap-2">
                {isUnlocked ? (
                  <>
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    <span>Student has unlocked this achievement.</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-amber-500" />
                    <span>This achievement is still locked.</span>
                  </>
                )}
              </div>
            </DetailBlock>

            <DetailBlock label="Description">
              {achievement.description || 'No description available.'}
            </DetailBlock>

            <DetailBlock label="How to Unlock">
              {getHowToUnlock(achievement)}
            </DetailBlock>

            <DetailBlock label="Rewards">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700">
                  <Trophy className="h-3.5 w-3.5" />
                  {achievement.rewardXP || 0} XP
                </span>

                <span className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700">
                  {achievement.rewardPoints || 0} pts
                </span>
              </div>
            </DetailBlock>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-100 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[14px] px-5 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
