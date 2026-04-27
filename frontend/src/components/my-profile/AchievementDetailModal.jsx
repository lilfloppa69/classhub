import { Lock, Sparkles, X } from 'lucide-react'

function getAchievementTypeLabel(type) {
  return type === 'class' ? 'Class Achievement' : 'System Achievement'
}

function getHowToUnlock(achievement) {
  if (!achievement) return 'Complete the requirement for this achievement.'

  const triggerMap = {
    create_forum: 'Create forum posts',
    reply_forum: 'Reply to forum discussions',
    get_forum_upvote: 'Receive forum upvotes',
    submit_assignment: 'Submit assignments',
  }

  const actionText =
    triggerMap[achievement.trigger] || 'Complete the requirement'

  return `${actionText} until you reach ${achievement.conditionValue}.`
}

export default function AchievementDetailModal({
  isOpen,
  onClose,
  achievement,
  isLocked,
  canToggleDisplay = false,
  isToggling = false,
  onToggleDisplay,
}) {
  if (!isOpen || !achievement) return null

  const iconText = achievement.title?.charAt(0)?.toUpperCase() || 'A'

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-[520px] rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[24px] font-semibold text-slate-900">
              Achievement Detail
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Learn what this achievement does and how to unlock it.
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

        <div className="rounded-[24px] bg-gradient-to-r from-violet-600 to-sky-500 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-semibold">
              {iconText}
            </div>

            <div>
              <h3 className="text-[22px] font-semibold">{achievement.title}</h3>
              <p className="mt-1 text-sm text-white/85">
                {getAchievementTypeLabel(achievement.type)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-[18px] bg-slate-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Status
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
              {isLocked ? (
                <>
                  <Lock className="h-4 w-4 text-amber-500" />
                  Locked
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  Unlocked
                </>
              )}
            </div>
          </div>

          <div className="rounded-[18px] bg-slate-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Description
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              {achievement.description || 'No description available.'}
            </p>
          </div>

          <div className="rounded-[18px] bg-slate-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              How to Unlock
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              {getHowToUnlock(achievement)}
            </p>
          </div>

          <div className="rounded-[18px] bg-slate-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Rewards
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              {achievement.rewardXP || 0} XP • {achievement.rewardPoints || 0}{' '}
              pts
            </p>
          </div>
        </div>

        {canToggleDisplay && !isLocked ? (
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[14px] px-5 py-3 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Close
            </button>

            <button
              type="button"
              onClick={onToggleDisplay}
              disabled={isToggling}
              className={`rounded-[14px] px-5 py-3 text-sm font-medium text-white transition disabled:opacity-60 ${
                achievement.isDisplayed
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-[#4e83f1] hover:brightness-105'
              }`}
            >
              {isToggling
                ? 'Updating...'
                : achievement.isDisplayed
                  ? 'Remove from display'
                  : 'Display this achievement'}
            </button>
          </div>
        ) : (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[14px] px-5 py-3 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
