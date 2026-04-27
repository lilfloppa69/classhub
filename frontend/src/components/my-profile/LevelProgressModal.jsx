import { X } from 'lucide-react'

function getRequiredXpForLevel(level) {
  return level * 1000
}

export default function LevelProgressModal({
  isOpen,
  onClose,
  currentLevel = 1,
  currentXp = 0,
  levelTitles = [],
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/35 px-4">
      <div className="flex max-h-[86vh] w-full max-w-[760px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-[24px] font-semibold text-slate-900">
              Level Progress
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review all levels from 1 to 20 and their XP requirements.
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

        <div className="overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 20 }).map((_, index) => {
              const level = index + 1
              const requiredXp = getRequiredXpForLevel(level)
              const isCurrent = currentLevel === level
              const isPassed = currentLevel > level

              return (
                <button
                  key={level}
                  type="button"
                  className={`rounded-[20px] border p-5 text-left transition ${
                    isCurrent
                      ? 'border-violet-300 bg-violet-50'
                      : isPassed
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Level {level}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">
                        {levelTitles[index] || `Level ${level}`}
                      </h3>
                    </div>

                    <div
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        isCurrent
                          ? 'bg-violet-200 text-violet-800'
                          : isPassed
                            ? 'bg-emerald-200 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isCurrent ? 'Current' : isPassed ? 'Passed' : 'Locked'}
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-slate-600">
                    <p>
                      XP needed to reach this level:{' '}
                      <span className="font-semibold text-slate-900">
                        {requiredXp.toLocaleString()} XP
                      </span>
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-6 rounded-[20px] bg-slate-50 px-5 py-4 text-sm text-slate-600">
            You are currently at{' '}
            <span className="font-semibold text-slate-900">
              Level {currentLevel}
            </span>{' '}
            with{' '}
            <span className="font-semibold text-slate-900">
              {currentXp.toLocaleString()} XP
            </span>
            .
          </div>
        </div>
      </div>
    </div>
  )
}
