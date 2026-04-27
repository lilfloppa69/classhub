export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmText = 'Yes',
  cancelText = "Yesn't",
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-[420px] rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
        <h2 className="text-[24px] font-semibold text-slate-900">{title}</h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">{message}</p>

        <div className="mt-7 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-[16px] px-5 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-60"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-[16px] bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {isLoading ? 'Leaving...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
