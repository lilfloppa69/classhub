import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Pencil,
  Trash2,
  ArrowBigUp,
  Reply,
  SquarePen,
  Bold,
  Italic,
  Underline,
  Image as ImageIcon,
  Sparkles,
  MessageCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import EditClassForumModal from '../components/forum/EditClassForumModal'

function getReplyAuthorName(reply) {
  return (
    reply.author?.displayName ||
    reply.author?.fullName ||
    reply.author?.username ||
    'Unknown User'
  )
}

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

function AchievementBadges({ badges = [] }) {
  if (!badges.length) return null

  return (
    <div className="mt-2 flex items-center gap-1.5">
      {badges.slice(0, 2).map((badge) => (
        <div
          key={badge._id}
          title={badge.title}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8c79eb] text-[10px] font-semibold text-white shadow-sm ring-2 ring-white"
        >
          {badge.icon || badge.title?.charAt(0)?.toUpperCase() || 'A'}
        </div>
      ))}
    </div>
  )
}

function buildReplyTree(replies = []) {
  const replyMap = new Map()
  const rootReplies = []

  replies.forEach((reply) => {
    replyMap.set(String(reply._id), {
      ...reply,
      children: [],
    })
  })

  replies.forEach((reply) => {
    const currentId = String(reply._id)
    const parentId = reply.parentReplyId ? String(reply.parentReplyId) : null
    const currentReply = replyMap.get(currentId)

    if (!parentId) {
      rootReplies.push(currentReply)
      return
    }

    const parentReply = replyMap.get(parentId)

    if (!parentReply) {
      rootReplies.push(currentReply)
      return
    }

    parentReply.children.push(currentReply)
  })

  return rootReplies
}

function wrapSelectedText({ textarea, value, setValue, startTag, endTag }) {
  if (!textarea) return

  const start = textarea.selectionStart ?? 0
  const end = textarea.selectionEnd ?? 0
  const selectedText = value.slice(start, end)

  const hasSelection = start !== end
  const nextText = hasSelection
    ? `${value.slice(0, start)}${startTag}${selectedText}${endTag}${value.slice(end)}`
    : `${value.slice(0, start)}${startTag}${endTag}${value.slice(end)}`

  setValue(nextText)

  requestAnimationFrame(() => {
    textarea.focus()

    if (hasSelection) {
      textarea.setSelectionRange(
        start + startTag.length,
        start + startTag.length + selectedText.length,
      )
    } else {
      textarea.setSelectionRange(
        start + startTag.length,
        start + startTag.length,
      )
    }
  })
}

function getTagStyle(tag) {
  const value = String(tag || '').toLowerCase()

  if (value === 'announcement') {
    return 'bg-amber-100 text-amber-700 border border-amber-200'
  }
  if (value === 'resource') {
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
  }
  if (value === 'question') {
    return 'bg-sky-100 text-sky-700 border border-sky-200'
  }

  return 'bg-violet-100 text-violet-700 border border-violet-200'
}

function MiniToolbarButton({ onClick, children, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
    >
      {children}
    </button>
  )
}

function ReplyNode({
  reply,
  level = 0,
  replyingTo,
  setReplyingTo,
  replyDrafts,
  setReplyDrafts,
  handleSubmitInlineReply,
  isSubmittingReply,
  handleToggleReplyUpvote,
  replyUpvoteLoadingId,
  editingReplyId,
  setEditingReplyId,
  editDrafts,
  setEditDrafts,
  handleStartEditReply,
  handleSubmitEditReply,
  handleCancelEditReply,
  savingEditReplyId,
  handleDeleteReply,
  deletingReplyId,
  user,
  handleUploadReplyImage,
  replyContent,
  setReplyContent,
}) {
  const authorName = getReplyAuthorName(reply)
  const timeText = reply.createdAt
    ? new Date(reply.createdAt).toLocaleString()
    : ''

  const indentClass =
    level === 0 ? '' : level === 1 ? 'ml-10' : level === 2 ? 'ml-20' : 'ml-20'

  const isBeyondVisualLimit = level >= 3
  const isReplyingHere = replyingTo?._id === reply._id
  const draftValue = replyDrafts[reply._id] || ''
  const editValue = editDrafts[reply._id] || ''
  const isEditingHere = editingReplyId === reply._id

  const formRef = useRef(null)
  const replyTextareaRef = useRef(null)
  const editTextareaRef = useRef(null)

  const isReplyAuthor =
    String(reply.author?._id || '') === String(user?._id || '')

  const canEditReply = isReplyAuthor
  const canDeleteReply = isReplyAuthor

  const applyReplyFormat = (startTag, endTag) => {
    wrapSelectedText({
      textarea: replyTextareaRef.current,
      value: draftValue,
      setValue: (nextValue) =>
        setReplyDrafts((prev) => ({
          ...prev,
          [reply._id]: nextValue,
        })),
      startTag,
      endTag,
    })
  }

  const applyEditFormat = (startTag, endTag) => {
    wrapSelectedText({
      textarea: editTextareaRef.current,
      value: editValue,
      setValue: (nextValue) =>
        setEditDrafts((prev) => ({
          ...prev,
          [reply._id]: nextValue,
        })),
      startTag,
      endTag,
    })
  }

  useEffect(() => {
    if (isReplyingHere && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isReplyingHere])

  return (
    <div className="space-y-4">
      <div className={`flex gap-4 ${indentClass}`}>
        <div className="flex shrink-0 flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-200 via-indigo-200 to-sky-200 text-sm font-semibold text-slate-700">
            {buildAvatarUrl(reply.author?.avatar) ? (
              <img
                src={buildAvatarUrl(reply.author.avatar)}
                alt={authorName}
                className="h-full w-full object-cover"
              />
            ) : (
              authorName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="mt-2 h-full w-[2px] rounded-full bg-gradient-to-b from-violet-200 to-transparent" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="rounded-[22px] border border-white/70 bg-white/90 px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[15px] font-semibold text-slate-800">
                {authorName}
              </p>
              <span className="text-[12px] text-slate-400">•</span>
              <span className="text-[12px] text-slate-500">{timeText}</span>
            </div>
            <AchievementBadges
              badges={reply.author?.showcaseAchievements || []}
            />

            {isBeyondVisualLimit && reply.parentReplyId && (
              <p className="mt-2 text-[12px] text-slate-500">
                replying in deeper thread
              </p>
            )}

            {reply.isDeleted ? (
              <p className="mt-3 text-[13px] italic text-slate-400">
                This message was deleted
              </p>
            ) : (
              <div
                className="mt-3 text-[14px] leading-7 text-slate-700 [&_b]:font-bold [&_i]:italic [&_u]:underline [&_img]:mt-3 [&_img]:max-w-full [&_img]:rounded-[14px]"
                dangerouslySetInnerHTML={{ __html: reply.content || '' }}
              />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 pl-1">
            <button
              type="button"
              onClick={() => handleToggleReplyUpvote(reply._id)}
              disabled={replyUpvoteLoadingId === reply._id}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-medium transition ${
                reply.hasUpvoted
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700'
              } disabled:cursor-not-allowed disabled:opacity-70`}
            >
              <ArrowBigUp className="h-4 w-4" />
              <span>{reply.upvoteCount || 0}</span>
            </button>

            <button
              type="button"
              onClick={() => setReplyingTo(reply)}
              className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[12px] font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
            >
              <Reply className="h-4 w-4" />
              <span>Reply</span>
            </button>

            {canEditReply ? (
              <button
                type="button"
                onClick={() => handleStartEditReply(reply)}
                className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[12px] font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
              >
                <SquarePen className="h-4 w-4" />
                <span>Edit</span>
              </button>
            ) : null}

            {canDeleteReply ? (
              <button
                type="button"
                onClick={() => handleDeleteReply(reply)}
                disabled={deletingReplyId === reply._id}
                className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[12px] font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            ) : null}
          </div>

          {isReplyingHere && (
            <form
              ref={formRef}
              onSubmit={(e) => handleSubmitInlineReply(e, reply)}
              className="mt-4 space-y-3"
            >
              <div className="rounded-[16px] border border-violet-200 bg-violet-50 px-4 py-3 text-[13px] text-violet-800">
                Replying to <strong>{authorName}</strong>
              </div>

              <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <MiniToolbarButton
                    title="Bold"
                    onClick={() => applyReplyFormat('<b>', '</b>')}
                  >
                    <Bold className="h-4 w-4" />
                  </MiniToolbarButton>

                  <MiniToolbarButton
                    title="Italic"
                    onClick={() => applyReplyFormat('<i>', '</i>')}
                  >
                    <Italic className="h-4 w-4" />
                  </MiniToolbarButton>

                  <MiniToolbarButton
                    title="Underline"
                    onClick={() => applyReplyFormat('<u>', '</u>')}
                  >
                    <Underline className="h-4 w-4" />
                  </MiniToolbarButton>

                  <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[12px] border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700">
                    <ImageIcon className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleUploadReplyImage(e, reply._id, 'reply')
                      }
                    />
                  </label>
                </div>

                <textarea
                  ref={replyTextareaRef}
                  value={draftValue}
                  onChange={(e) =>
                    setReplyDrafts((prev) => ({
                      ...prev,
                      [reply._id]: e.target.value,
                    }))
                  }
                  placeholder="Write a reply..."
                  className="min-h-[120px] w-full resize-none rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white"
                />
              </div>

              {draftValue ? (
                <div className="rounded-[18px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                    Preview
                  </p>
                  <div
                    className="text-[14px] text-slate-700 [&_b]:font-bold [&_i]:italic [&_u]:underline [&_img]:max-w-full [&_img]:rounded-[12px]"
                    dangerouslySetInnerHTML={{ __html: draftValue || '' }}
                  />
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmittingReply}
                  className="rounded-[14px] bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-[14px] font-medium text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmittingReply ? 'Posting...' : 'Post Reply'}
                </button>

                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-[14px] text-slate-500 transition hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {isEditingHere && (
            <form
              onSubmit={(e) => handleSubmitEditReply(e, reply)}
              className="mt-4 space-y-3"
            >
              <div className="rounded-[16px] border border-sky-200 bg-sky-50 px-4 py-3 text-[13px] text-sky-800">
                Editing reply by <strong>{authorName}</strong>
              </div>

              <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <MiniToolbarButton
                    title="Bold"
                    onClick={() => applyEditFormat('<b>', '</b>')}
                  >
                    <Bold className="h-4 w-4" />
                  </MiniToolbarButton>

                  <MiniToolbarButton
                    title="Italic"
                    onClick={() => applyEditFormat('<i>', '</i>')}
                  >
                    <Italic className="h-4 w-4" />
                  </MiniToolbarButton>

                  <MiniToolbarButton
                    title="Underline"
                    onClick={() => applyEditFormat('<u>', '</u>')}
                  >
                    <Underline className="h-4 w-4" />
                  </MiniToolbarButton>

                  <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[12px] border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-sky-50 hover:text-sky-700">
                    <ImageIcon className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleUploadReplyImage(e, reply._id, 'edit')
                      }
                    />
                  </label>
                </div>

                <textarea
                  ref={editTextareaRef}
                  value={editValue}
                  onChange={(e) =>
                    setEditDrafts((prev) => ({
                      ...prev,
                      [reply._id]: e.target.value,
                    }))
                  }
                  placeholder="Edit your reply..."
                  className="min-h-[120px] w-full resize-none rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white"
                />
              </div>

              {editValue ? (
                <div className="rounded-[18px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                    Preview
                  </p>
                  <div
                    className="text-[14px] text-slate-700 [&_b]:font-bold [&_i]:italic [&_u]:underline [&_img]:max-w-full [&_img]:rounded-[12px]"
                    dangerouslySetInnerHTML={{ __html: editValue || '' }}
                  />
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={savingEditReplyId === reply._id}
                  className="rounded-[14px] bg-gradient-to-r from-sky-600 to-cyan-600 px-5 py-2.5 text-[14px] font-medium text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingEditReplyId === reply._id ? 'Saving...' : 'Save Edit'}
                </button>

                <button
                  type="button"
                  onClick={handleCancelEditReply}
                  className="text-[14px] text-slate-500 transition hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {reply.children?.length > 0 && (
        <div className="space-y-4">
          {reply.children.map((childReply) => (
            <ReplyNode
              key={childReply._id}
              reply={childReply}
              level={level + 1}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyDrafts={replyDrafts}
              setReplyDrafts={setReplyDrafts}
              handleSubmitInlineReply={handleSubmitInlineReply}
              isSubmittingReply={isSubmittingReply}
              handleToggleReplyUpvote={handleToggleReplyUpvote}
              replyUpvoteLoadingId={replyUpvoteLoadingId}
              editingReplyId={editingReplyId}
              setEditingReplyId={setEditingReplyId}
              editDrafts={editDrafts}
              setEditDrafts={setEditDrafts}
              handleStartEditReply={handleStartEditReply}
              handleSubmitEditReply={handleSubmitEditReply}
              handleCancelEditReply={handleCancelEditReply}
              savingEditReplyId={savingEditReplyId}
              handleDeleteReply={handleDeleteReply}
              deletingReplyId={deletingReplyId}
              user={user}
              handleUploadReplyImage={handleUploadReplyImage}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ClassForumDetail() {
  const navigate = useNavigate()
  const { classId, forumId } = useParams()

  const [forum, setForum] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyDrafts, setReplyDrafts] = useState({})
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [visibleCount, setVisibleCount] = useState(2)
  const [isThreadUpvoting, setIsThreadUpvoting] = useState(false)
  const [replyUpvoteLoadingId, setReplyUpvoteLoadingId] = useState(null)
  const { user } = useAuth()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeletingThread, setIsDeletingThread] = useState(false)
  const [classInfo, setClassInfo] = useState(null)
  const [editingReplyId, setEditingReplyId] = useState(null)
  const [editDrafts, setEditDrafts] = useState({})
  const [savingEditReplyId, setSavingEditReplyId] = useState(null)
  const [deletingReplyId, setDeletingReplyId] = useState(null)

  const mainReplyTextareaRef = useRef(null)

  const applyMainReplyFormat = (startTag, endTag) => {
    wrapSelectedText({
      textarea: mainReplyTextareaRef.current,
      value: replyContent,
      setValue: setReplyContent,
      startTag,
      endTag,
    })
  }

  const fetchForumDetail = async () => {
    try {
      const res = await api.get(`/classes/${classId}/forum/${forumId}`)
      setForum(res.data?.data || null)
    } catch (error) {
      console.error('Failed to fetch class forum detail:', error)
      setForum(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    fetchForumDetail()
  }, [classId, forumId])

  useEffect(() => {
    setVisibleCount(2)
  }, [forumId])

  const authorName =
    forum?.author?.displayName ||
    forum?.author?.fullName ||
    forum?.author?.username ||
    'Unknown User'

  const createdAtText = forum?.createdAt
    ? new Date(forum.createdAt).toLocaleString()
    : ''

  const isThreadAuthor =
    String(forum?.author?._id || '') === String(user?._id || '')

  const replyTree = useMemo(() => {
    return buildReplyTree(forum?.replies || [])
  }, [forum])

  const flattenTreeForPreview = (nodes) => {
    const rows = []

    const walk = (items) => {
      items.forEach((item) => {
        rows.push(item)
        if (item.children?.length) {
          walk(item.children)
        }
      })
    }

    walk(nodes)
    return rows
  }

  const fetchClassInfo = async () => {
    try {
      const res = await api.get(`/classes/${classId}`)
      setClassInfo(res.data?.data || null)
    } catch (error) {
      console.error('Failed to fetch class info:', error)
      setClassInfo(null)
    }
  }

  useEffect(() => {
    fetchClassInfo()
  }, [classId])

  const previewRows = useMemo(() => {
    return flattenTreeForPreview(replyTree)
  }, [replyTree])

  const hasMoreReplies = previewRows.length > visibleCount

  const handleSelectReplyTarget = (reply) => {
    setReplyingTo(reply)
  }

  const handleCancelReplyTarget = () => {
    setReplyingTo(null)
  }

  const handleSubmitReply = async (e) => {
    e.preventDefault()

    if (!replyContent.trim()) {
      toast.error('Reply cannot be empty')
      return
    }

    try {
      setIsSubmittingReply(true)

      await api.post(`/classes/${classId}/forum/${forumId}/reply`, {
        content: replyContent.trim(),
        parentReplyId: null,
      })

      toast.success('Reply posted')
      setReplyContent('')

      await fetchForumDetail()
    } catch (error) {
      console.error('Failed to submit reply:', error)
      toast.error(error.response?.data?.message || 'Failed to post reply')
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleSubmitInlineReply = async (e, parentReply) => {
    e.preventDefault()

    const content = replyDrafts[parentReply._id]?.trim()

    if (!content) {
      toast.error('Reply cannot be empty')
      return
    }

    try {
      setIsSubmittingReply(true)

      await api.post(`/classes/${classId}/forum/${forumId}/reply`, {
        content,
        parentReplyId: String(parentReply._id),
      })

      toast.success('Reply posted')

      setReplyDrafts((prev) => ({
        ...prev,
        [parentReply._id]: '',
      }))
      setReplyingTo(null)

      await fetchForumDetail()
    } catch (error) {
      console.error('Failed to submit inline reply:', error)
      toast.error(error.response?.data?.message || 'Failed to post reply')
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleStartEditReply = (reply) => {
    setEditingReplyId(reply._id)
    setEditDrafts((prev) => ({
      ...prev,
      [reply._id]: reply.content || '',
    }))
    setReplyingTo(null)
  }

  const handleCancelEditReply = () => {
    setEditingReplyId(null)
  }

  const handleSubmitEditReply = async (e, reply) => {
    e.preventDefault()

    const content = editDrafts[reply._id]?.trim()

    if (!content) {
      toast.error('Reply cannot be empty')
      return
    }

    try {
      setSavingEditReplyId(reply._id)

      await api.put(
        `/classes/${classId}/forum/${forumId}/replies/${reply._id}`,
        {
          content,
          attachments: reply.attachments || [],
        },
      )

      toast.success('Reply updated')
      setEditingReplyId(null)

      await fetchForumDetail()
    } catch (error) {
      console.error('Failed to edit reply:', error)
      toast.error(error.response?.data?.message || 'Failed to update reply')
    } finally {
      setSavingEditReplyId(null)
    }
  }

  const handleDeleteReply = async (reply) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this reply?',
    )

    if (!confirmed) return

    try {
      setDeletingReplyId(reply._id)

      await api.delete(
        `/classes/${classId}/forum/${forumId}/replies/${reply._id}`,
      )

      toast.success('Reply deleted')

      if (editingReplyId === reply._id) {
        setEditingReplyId(null)
      }

      if (replyingTo?._id === reply._id) {
        setReplyingTo(null)
      }

      await fetchForumDetail()
    } catch (error) {
      console.error('Failed to delete reply:', error)
      toast.error(error.response?.data?.message || 'Failed to delete reply')
    } finally {
      setDeletingReplyId(null)
    }
  }

  const handleToggleThreadUpvote = async () => {
    if (!forum?._id || isThreadUpvoting) return

    try {
      setIsThreadUpvoting(true)

      const res = await api.post(`/classes/${classId}/forum/${forumId}/upvote`)

      const nextCount = res.data?.data?.upvoteCount ?? forum.upvoteCount ?? 0
      const nextHasUpvoted = res.data?.data?.hasUpvoted ?? false

      setForum((prev) => {
        if (!prev) return prev

        return {
          ...prev,
          upvoteCount: nextCount,
          hasUpvoted: nextHasUpvoted,
        }
      })
    } catch (error) {
      console.error('Failed to toggle thread upvote:', error)
      toast.error(error.response?.data?.message || 'Failed to update upvote')
    } finally {
      setIsThreadUpvoting(false)
    }
  }

  const handleToggleReplyUpvote = async (replyId) => {
    if (!replyId || replyUpvoteLoadingId) return

    try {
      setReplyUpvoteLoadingId(replyId)

      const res = await api.post(
        `/classes/${classId}/forum/${forumId}/replies/${replyId}/upvote`,
      )

      const nextCount = res.data?.data?.upvoteCount ?? 0
      const nextHasUpvoted = res.data?.data?.hasUpvoted ?? false

      const updateReplyTree = (nodes) =>
        nodes.map((node) => {
          if (String(node._id) === String(replyId)) {
            return {
              ...node,
              upvoteCount: nextCount,
              hasUpvoted: nextHasUpvoted,
            }
          }

          if (node.children?.length) {
            return {
              ...node,
              children: updateReplyTree(node.children),
            }
          }

          return node
        })

      setForum((prev) => {
        if (!prev) return prev

        const nextReplies = updateReplyTree(buildReplyTree(prev.replies || []))

        const flattenBack = (items) => {
          const rows = []

          const walk = (nodes) => {
            nodes.forEach((node) => {
              const { children, ...rest } = node
              rows.push(rest)
              if (children?.length) {
                walk(children)
              }
            })
          }

          walk(items)
          return rows
        }

        return {
          ...prev,
          replies: flattenBack(nextReplies),
        }
      })
    } catch (error) {
      console.error('Failed to toggle reply upvote:', error)
      toast.error(
        error.response?.data?.message || 'Failed to update reply upvote',
      )
    } finally {
      setReplyUpvoteLoadingId(null)
    }
  }

  const handleDeleteThread = async () => {
    if (!forum?._id || isDeletingThread) return

    const confirmed = window.confirm(
      'Are you sure you want to delete this thread?',
    )

    if (!confirmed) return

    try {
      setIsDeletingThread(true)

      await api.delete(`/classes/${classId}/forum/${forumId}`)

      toast.success('Thread deleted')
      navigate(`/classes/${classId}/forum`)
    } catch (error) {
      console.error('Failed to delete thread:', error)
      toast.error(error.response?.data?.message || 'Failed to delete thread')
    } finally {
      setIsDeletingThread(false)
    }
  }

  const handleUploadReplyImage = async (e, targetId, mode = 'reply') => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await api.post(
        `/classes/${classId}/forum/upload-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      )

      const url = res.data?.data?.url
      if (!url) {
        toast.error('Image URL not returned')
        return
      }

      const imageHtml = `<img src="${url}" alt="reply-uploaded" style="max-width:100%;border-radius:12px;margin:12px 0;" />`

      if (mode === 'main') {
        setReplyContent((prev) => `${prev || ''}${imageHtml}`)
      } else if (mode === 'reply') {
        setReplyDrafts((prev) => ({
          ...prev,
          [targetId]: `${prev[targetId] || ''}${imageHtml}`,
        }))
      } else {
        setEditDrafts((prev) => ({
          ...prev,
          [targetId]: `${prev[targetId] || ''}${imageHtml}`,
        }))
      }

      toast.success('Image uploaded')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image')
    } finally {
      e.target.value = ''
    }
  }

  if (isLoading) {
    return (
      <div className="px-6 py-6">
        <div className="rounded-[32px] border border-violet-100 bg-gradient-to-br from-[#fcfbff] via-[#f8f5ff] to-[#f2f7ff] px-8 py-8 shadow-[0_20px_60px_rgba(124,58,237,0.08)]">
          <div className="h-10 w-72 rounded-xl bg-violet-100" />
          <div className="mt-4 h-6 w-96 rounded-xl bg-slate-100" />
          <div className="mt-8 h-[220px] rounded-[28px] bg-white" />
        </div>
      </div>
    )
  }

  if (!forum) {
    return (
      <div className="px-6 py-6">
        <div className="rounded-[32px] border border-violet-100 bg-gradient-to-br from-[#fcfbff] via-[#f8f5ff] to-[#f2f7ff] px-8 py-12 text-center text-slate-500 shadow-[0_20px_60px_rgba(124,58,237,0.08)]">
          Forum not found
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-6">
      <div className="rounded-[32px] border border-violet-100 bg-gradient-to-br from-[#fcfbff] via-[#f8f5ff] to-[#f2f7ff] px-8 pt-8 pb-10 shadow-[0_20px_60px_rgba(124,58,237,0.08)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-medium text-violet-700">
              <Sparkles className="h-4 w-4" />
              Forum Thread
            </div>

            <div
              className="text-[38px] font-semibold tracking-[-0.02em] text-slate-900 [&_b]:font-bold [&_i]:italic [&_u]:underline"
              dangerouslySetInnerHTML={{ __html: forum.title || '' }}
            />

            <div className="mt-4 flex flex-wrap items-center gap-3 text-[14px] text-slate-500">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-200 via-indigo-200 to-sky-200 text-xs font-semibold text-slate-700">
                {buildAvatarUrl(forum.author?.avatar) ? (
                  <img
                    src={buildAvatarUrl(forum.author.avatar)}
                    alt={authorName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  authorName.charAt(0).toUpperCase()
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-700">
                    {authorName}
                  </span>
                  <span>•</span>
                  <span>{createdAtText}</span>
                </div>

                <AchievementBadges
                  badges={forum.author?.showcaseAchievements || []}
                />
              </div>

              <span>•</span>
              <span
                className={`rounded-full px-3 py-1 text-[12px] font-medium capitalize ${getTagStyle(
                  forum.tag,
                )}`}
              >
                {forum.tag}
              </span>
            </div>

            <div
              className="mt-6 rounded-[24px] border border-white/70 bg-white/85 px-6 py-6 text-[16px] leading-8 text-slate-700 shadow-[0_10px_40px_rgba(15,23,42,0.05)] [&_b]:font-bold [&_i]:italic [&_u]:underline [&_img]:mt-3 [&_img]:max-w-full [&_img]:rounded-[14px]"
              dangerouslySetInnerHTML={{ __html: forum.description || '' }}
            />

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleThreadUpvote}
                disabled={isThreadUpvoting}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium transition ${
                  forum.hasUpvoted
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-white text-slate-700 shadow-sm hover:bg-violet-50 hover:text-violet-700'
                } disabled:cursor-not-allowed disabled:opacity-70`}
              >
                <ArrowBigUp className="h-4 w-4" />
                <span>{forum.upvoteCount || 0}</span>
                <span>{forum.hasUpvoted ? 'Upvoted' : 'Upvote'}</span>
              </button>
            </div>
          </div>

          {isThreadAuthor ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-white px-4 text-slate-700 shadow-md transition hover:-translate-y-0.5 hover:bg-sky-50 hover:text-sky-700"
              >
                <Pencil className="h-4 w-4" />
                <span className="text-sm font-medium">Edit</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteThread}
                disabled={isDeletingThread}
                className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-white px-4 text-slate-700 shadow-md transition hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-sm font-medium">Delete</span>
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-10 rounded-[26px] border border-white/70 bg-white/85 p-5 shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <MessageCircle className="h-4 w-4 text-violet-500" />
            Join the discussion
          </div>

          <form onSubmit={handleSubmitReply} className="space-y-4">
            {replyingTo && (
              <div className="flex items-center justify-between rounded-[16px] border border-violet-200 bg-violet-50 px-5 py-3 text-[14px] text-violet-800">
                <span>
                  Replying to{' '}
                  <strong>
                    {replyingTo.author?.displayName ||
                      replyingTo.author?.fullName ||
                      replyingTo.author?.username ||
                      'Unknown User'}
                  </strong>
                </span>

                <button
                  type="button"
                  onClick={handleCancelReplyTarget}
                  className="text-violet-600 transition hover:text-violet-800"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <MiniToolbarButton
                  title="Bold"
                  onClick={() => applyMainReplyFormat('<b>', '</b>')}
                >
                  <Bold className="h-4 w-4" />
                </MiniToolbarButton>

                <MiniToolbarButton
                  title="Italic"
                  onClick={() => applyMainReplyFormat('<i>', '</i>')}
                >
                  <Italic className="h-4 w-4" />
                </MiniToolbarButton>

                <MiniToolbarButton
                  title="Underline"
                  onClick={() => applyMainReplyFormat('<u>', '</u>')}
                >
                  <Underline className="h-4 w-4" />
                </MiniToolbarButton>

                <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[12px] border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700">
                  <ImageIcon className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUploadReplyImage(e, null, 'main')}
                  />
                </label>
              </div>

              <textarea
                ref={mainReplyTextareaRef}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={
                  replyingTo ? 'Write a nested reply...' : 'Write a reply...'
                }
                className="min-h-[130px] w-full resize-none rounded-[16px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white"
              />
            </div>

            {replyContent ? (
              <div className="rounded-[18px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                  Preview
                </p>
                <div
                  className="text-[14px] text-slate-700 [&_b]:font-bold [&_i]:italic [&_u]:underline [&_img]:max-w-full [&_img]:rounded-[12px]"
                  dangerouslySetInnerHTML={{ __html: replyContent || '' }}
                />
              </div>
            ) : null}

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmittingReply}
                className="rounded-[16px] bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-[15px] font-medium text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmittingReply ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-10 space-y-6">
          {replyTree.length > 0 ? (
            replyTree.map((reply) => {
              const flatIndex = previewRows.findIndex(
                (item) => String(item._id) === String(reply._id),
              )

              if (flatIndex >= visibleCount) return null

              return (
                <ReplyNode
                  key={reply._id}
                  reply={reply}
                  level={0}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  replyDrafts={replyDrafts}
                  setReplyDrafts={setReplyDrafts}
                  handleSubmitInlineReply={handleSubmitInlineReply}
                  isSubmittingReply={isSubmittingReply}
                  handleToggleReplyUpvote={handleToggleReplyUpvote}
                  replyUpvoteLoadingId={replyUpvoteLoadingId}
                  editingReplyId={editingReplyId}
                  setEditingReplyId={setEditingReplyId}
                  editDrafts={editDrafts}
                  setEditDrafts={setEditDrafts}
                  handleStartEditReply={handleStartEditReply}
                  handleSubmitEditReply={handleSubmitEditReply}
                  handleCancelEditReply={handleCancelEditReply}
                  savingEditReplyId={savingEditReplyId}
                  handleDeleteReply={handleDeleteReply}
                  deletingReplyId={deletingReplyId}
                  user={user}
                  handleUploadReplyImage={handleUploadReplyImage}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                />
              )
            })
          ) : (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/70 px-6 py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <MessageCircle className="h-5 w-5" />
              </div>
              <p className="text-[15px] font-medium text-slate-700">
                No replies yet
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Be the first to join this discussion.
              </p>
            </div>
          )}
        </div>

        {hasMoreReplies && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 2)}
              className="rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-slate-700 shadow-sm transition hover:bg-violet-50 hover:text-violet-700"
            >
              Show More
            </button>
          </div>
        )}
      </div>

      <EditClassForumModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        classId={classId}
        forumId={forumId}
        className={classInfo?.title || classInfo?.subject || ''}
        initialTitle={forum?.title || ''}
        initialDescription={forum?.description || ''}
        initialTag={forum?.tag || 'question'}
        onUpdated={fetchForumDetail}
      />
    </div>
  )
}
