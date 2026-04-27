import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Link as LinkIcon, X } from 'lucide-react'
import api from '../../services/api'

export default function JoinGeneralForumModal({ isOpen, onClose, onJoined }) {
  const [inviteToken, setInviteToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  useEffect(() => {
    if (isOpen) {
      setInviteToken('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const navigate = useNavigate()

  const handleJoin = async (e) => {
    e.preventDefault()

    if (!inviteToken.trim()) {
      toast.error('Invite token is required')
      return
    }

    try {
      setIsSubmitting(true)

      const res = await api.post('/forum/join-invite', {
        inviteToken: inviteToken.trim(),
      })

      const joinedForum = res.data?.data || null

      toast.success('Forum joined')
      setInviteToken('')
      onJoined?.()
      onClose?.()

      if (joinedForum?._id) {
        if (
          joinedForum.associationType === 'class' &&
          joinedForum.associatedClass
        ) {
          const classId =
            typeof joinedForum.associatedClass === 'string'
              ? joinedForum.associatedClass
              : joinedForum.associatedClass?._id

          if (classId) {
            navigate(`/classes/${classId}/forum/${joinedForum._id}`)
            return
          }
        }

        navigate(`/forum/${joinedForum._id}`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join forum')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-[560px] rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-slate-900">
              Join a Forum
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Invite-only forums do not appear in the public list. Enter the
              token to open them directly.
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

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Invite Token
            </label>

            <div className="relative">
              <input
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                placeholder="Enter invite token"
                className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 pr-11 outline-none"
              />
              <LinkIcon className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-[16px] bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Joining...' : 'Join Forum'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
