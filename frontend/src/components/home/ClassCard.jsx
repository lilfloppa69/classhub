import { Copy, LogOut } from 'lucide-react'

export default function ClassCard({
  subject,
  schedule,
  teacher,
  teacherAvatar,
  highlight = false,
  onClick,
  onLeave,
  onCopyLink,
}) {
  const handleFooterClick = (e, callback) => {
    e.stopPropagation()
    callback?.()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      className="min-w-0 cursor-pointer overflow-hidden rounded-[28px] border border-black/15 bg-white text-left transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative bg-[#D9D9D9] px-8 pt-6 pb-8 pr-32">
        <div className="space-y-1 break-words text-[15px] leading-6 text-black">
          <div className="text-xl font-bold">{subject}</div>
          <div className="font-semibold">{schedule}</div>
          <div className="text-sm">{teacher}</div>
        </div>

        {highlight && (
          <div className="absolute right-6 top-1/2 flex h-20 w-20 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-[#B75A4D]">
            {teacherAvatar ? (
              <img
                src={teacherAvatar}
                alt={teacher}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-white">
                {(teacher || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="h-[130px] bg-white" />

      <div>
        <div className="h-px w-full bg-gray-600/60" />

        <div className="flex items-center justify-end gap-3 px-5 py-4">
          <button
            type="button"
            title="Leave class"
            onClick={(e) => handleFooterClick(e, onLeave)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-red-500 transition hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
          </button>

          <button
            type="button"
            title="Copy class link"
            onClick={(e) => handleFooterClick(e, onCopyLink)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
          >
            <Copy className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
