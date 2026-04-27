import { useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { joinClass } from '../../services/classService'

export default function JoinClassModal({ isOpen, onClose, onJoined }) {
  const [joinCode, setJoinCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!joinCode.trim()) {
      toast.error('Join code is required')
      return
    }

    try {
      setIsSubmitting(true)
      await joinClass(joinCode.trim().toUpperCase())
      toast.success('Joined class successfully')
      setJoinCode('')
      onJoined?.()
      onClose?.()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join class')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-[460px] overflow-hidden rounded-[30px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between bg-gradient-to-r from-[#6b57d8] to-[#69b2e2] px-7 py-6 text-white">
          <div>
            <h2 className="text-[26px] font-bold">Join Class</h2>
            <p className="mt-1 text-sm text-white/80">
              Enter the 6-character class join code.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-7">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Join Code
          </label>

          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="h-14 w-full rounded-[18px] border border-slate-200 bg-white px-5 text-center text-[22px] font-semibold uppercase tracking-[0.25em] text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#6b57d8]"
          />

          <div className="mt-7 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[16px] px-5 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[16px] bg-[#4e83f1] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
            >
              {isSubmitting ? 'Joining...' : 'Join Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
