import { PlusCircle, LogIn, X } from 'lucide-react'

export default function GeneralForumActionModal({
  isOpen,
  onClose,
  onChooseCreate,
  onChooseJoin,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-[520px] rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-slate-900">
              Forum Action
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose what you want to do next.
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={onChooseCreate}
            className="group rounded-[22px] border border-violet-200 bg-violet-50 p-6 text-left transition hover:-translate-y-0.5 hover:bg-violet-100"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-violet-600 shadow-sm">
              <PlusCircle className="h-7 w-7" />
            </div>

            <h3 className="text-lg font-semibold text-slate-900">
              Create a Forum
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Start a new general or class-linked discussion.
            </p>
          </button>

          <button
            type="button"
            onClick={onChooseJoin}
            className="group rounded-[22px] border border-sky-200 bg-sky-50 p-6 text-left transition hover:-translate-y-0.5 hover:bg-sky-100"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-sky-600 shadow-sm">
              <LogIn className="h-7 w-7" />
            </div>

            <h3 className="text-lg font-semibold text-slate-900">
              Join a Forum
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter a password or invite token to access a private forum.
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
