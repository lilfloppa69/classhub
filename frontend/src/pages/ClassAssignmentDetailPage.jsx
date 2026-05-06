import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  ChevronLeft,
  ChevronDown,
  Paperclip,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  Sparkles,
  MessageCirclePlus,
  Plus,
  Upload,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

function formatDate(date) {
  if (!date) return 'No due date'

  const value = new Date(date)

  const datePart = value.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const timePart = value.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${datePart} • ${timePart}`
}

function getRuleTypeLabel(ruleType) {
  switch (ruleType) {
    case 'fileName':
      return 'Exact file name'
    case 'fileFormat':
      return 'File format'
    case 'fileNameAndFormat':
      return 'File name + format'
    case 'fileNumber':
      return 'Number of files'
    case 'keyword':
      return 'Keyword in title'
    default:
      return 'Rule'
  }
}

function getAttachmentIcon(fileType, url = '') {
  const lower = String(url).toLowerCase()

  if (fileType === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(lower)) {
    return 'image'
  }

  if (fileType === 'link') {
    return 'link'
  }

  return 'file'
}

function inferSubmissionFileType(fileOrUrl, mime = '') {
  const input = String(fileOrUrl || '').toLowerCase()

  if (mime.startsWith('image/')) return 'image'
  if (mime.includes('pdf') || input.endsWith('.pdf')) return 'pdf'
  if (
    mime.includes('word') ||
    mime.includes('document') ||
    input.endsWith('.doc') ||
    input.endsWith('.docx')
  ) {
    return 'document'
  }
  if (
    mime.includes('sheet') ||
    mime.includes('excel') ||
    mime.includes('csv') ||
    input.endsWith('.xls') ||
    input.endsWith('.xlsx') ||
    input.endsWith('.csv')
  ) {
    return 'spreadsheet'
  }
  if (
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    input.endsWith('.ppt') ||
    input.endsWith('.pptx')
  ) {
    return 'presentation'
  }
  if (input.startsWith('http')) return 'link'
  return 'file'
}

function buildCommentTree(comments = []) {
  const map = new Map()
  const roots = []

  comments.forEach((comment) => {
    map.set(String(comment._id), {
      ...comment,
      children: [],
    })
  })

  comments.forEach((comment) => {
    const currentId = String(comment._id)
    const parentId = comment.parentCommentId
      ? String(comment.parentCommentId)
      : null
    const current = map.get(currentId)

    if (!parentId) {
      roots.push(current)
      return
    }

    const parent = map.get(parentId)

    if (!parent) {
      roots.push(current)
      return
    }

    parent.children.push(current)
  })

  return roots
}

function CommentNode({
  comment,
  user,
  replyingTo,
  setReplyingTo,
  replyDrafts,
  setReplyDrafts,
  handleCreateReply,
  expandedReplies,
  setExpandedReplies,
  handleDeleteComment,
  deletingCommentId,
  isPostingComment,
  level = 0,
}) {
  const authorName =
    comment.author?.displayName ||
    comment.author?.fullName ||
    comment.author?.username ||
    comment.author?.email ||
    'User'

  const isAuthor = String(comment.author?._id || '') === String(user?._id || '')

  const replies = comment.children || []
  const isExpanded = !!expandedReplies[comment._id]
  const visibleReplies = isExpanded ? replies : []

  return (
    <div className={`${level > 0 ? 'ml-10 mt-3' : ''}`}>
      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">{authorName}</p>
            <p className="text-xs text-slate-400">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
          </div>

          {isAuthor ? (
            <button
              type="button"
              onClick={() => handleDeleteComment(comment._id)}
              disabled={deletingCommentId === comment._id}
              className="text-xs font-medium text-red-500 transition hover:text-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          ) : null}
        </div>

        <div className="mt-3 text-sm leading-6 text-slate-700">
          {comment.isDeleted ? (
            <span className="italic text-slate-400">Comment deleted</span>
          ) : (
            comment.content
          )}
        </div>

        {!comment.isDeleted ? (
          <div className="mt-3 flex items-center gap-4">
            <button
              type="button"
              onClick={() =>
                setReplyingTo((prev) =>
                  prev === comment._id ? null : comment._id,
                )
              }
              className="text-xs font-medium text-violet-600 transition hover:text-violet-800"
            >
              Reply
            </button>

            {replies.length > 0 ? (
              <button
                type="button"
                onClick={() =>
                  setExpandedReplies((prev) => ({
                    ...prev,
                    [comment._id]: !prev[comment._id],
                  }))
                }
                className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
              >
                {isExpanded
                  ? 'Hide replies'
                  : `See ${replies.length} repl${replies.length > 1 ? 'ies' : 'y'}`}
              </button>
            ) : null}
          </div>
        ) : null}

        {replyingTo === comment._id ? (
          <div className="mt-4">
            <textarea
              value={replyDrafts[comment._id] || ''}
              onChange={(e) =>
                setReplyDrafts((prev) => ({
                  ...prev,
                  [comment._id]: e.target.value,
                }))
              }
              placeholder="Write a reply..."
              className="min-h-[90px] w-full resize-none rounded-[14px] border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-violet-300"
            />

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleCreateReply(comment._id)}
                disabled={isPostingComment}
                className="rounded-[12px] bg-violet-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
              >
                Reply
              </button>

              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {visibleReplies.length > 0 ? (
        <div className="mt-3 space-y-3">
          {visibleReplies.map((reply) => (
            <CommentNode
              key={reply._id}
              comment={reply}
              user={user}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyDrafts={replyDrafts}
              setReplyDrafts={setReplyDrafts}
              handleCreateReply={handleCreateReply}
              expandedReplies={expandedReplies}
              setExpandedReplies={setExpandedReplies}
              handleDeleteComment={handleDeleteComment}
              deletingCommentId={deletingCommentId}
              isPostingComment={isPostingComment}
              level={level + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function ClassAssignmentDetailPage() {
  const navigate = useNavigate()
  const { classId, assignmentId } = useParams()
  const { user } = useAuth()

  const [assignment, setAssignment] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isRulesOpen, setIsRulesOpen] = useState(false)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [submissionDraftFiles, setSubmissionDraftFiles] = useState([])
  const [submissionLinkValue, setSubmissionLinkValue] = useState('')
  const [isSubmissionLinkModalOpen, setIsSubmissionLinkModalOpen] =
    useState(false)
  const [isUploadingSubmissionFile, setIsUploadingSubmissionFile] =
    useState(false)
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false)
  const [comments, setComments] = useState([])
  const [commentInput, setCommentInput] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyDrafts, setReplyDrafts] = useState({})
  const [expandedReplies, setExpandedReplies] = useState({})
  const [isPostingComment, setIsPostingComment] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState(null)

  const fetchAssignmentDetail = async () => {
    try {
      setIsLoading(true)
      const res = await api.get(`/assignments/${assignmentId}`)
      const data = res.data?.data || null
      setAssignment(data)
      setComments(data?.comments || [])
    } catch (error) {
      console.error('Failed to fetch assignment detail:', error)
      setAssignment(null)
      setErrorMessage(
        error.response?.data?.message || 'Failed to fetch assignment detail',
      )
    } finally {
      setIsLoading(false)
      setErrorMessage('')
    }
  }

  useEffect(() => {
    fetchAssignmentDetail()
  }, [assignmentId])

  const existingSubmissionFiles = assignment?.submission?.files || []
  const hasDraftSubmission = submissionDraftFiles.length > 0
  const hasSubmittedAssignment =
    !!assignment?.submission?.submittedAt && existingSubmissionFiles.length > 0

  useEffect(() => {
    if (!isSubmitModalOpen) return
    if (submissionDraftFiles.length > 0) return
    if (hasSubmittedAssignment) return

    const existingFiles = assignment?.submission?.files || []

    setSubmissionDraftFiles(
      existingFiles.map((file, index) => ({
        id: `${file.url || 'file'}-${index}`,
        url: file.url,
        preview: file.preview || '',
        fileType: file.fileType || 'file',
        name: file.name || 'Submission file',
      })),
    )
  }, [
    isSubmitModalOpen,
    assignment,
    submissionDraftFiles.length,
    hasSubmittedAssignment,
  ])

  const handleUploadSubmissionFiles = async (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    try {
      setIsUploadingSubmissionFile(true)

      const uploaded = []

      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const res = await api.post(
          `/assignments/${assignmentId}/upload-submission-file`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        )

        const data = res.data?.data || {}
        const url = data.url

        if (!url) {
          throw new Error('Upload URL not returned')
        }

        uploaded.push({
          id: crypto.randomUUID(),
          url,
          preview: data.preview || (file.type.startsWith('image/') ? url : ''),
          fileType:
            data.fileType || inferSubmissionFileType(file.name, file.type),
          name: data.name || file.name,
        })
      }

      setSubmissionDraftFiles((prev) => [...prev, ...uploaded])
      toast.success('File added')
    } catch (error) {
      console.error('Failed to upload submission file:', error)
      toast.error(
        error.response?.data?.message || 'Failed to upload submission file',
      )
    } finally {
      setIsUploadingSubmissionFile(false)
      event.target.value = ''
    }
  }

  const handleAddSubmissionLink = () => {
    const trimmed = submissionLinkValue.trim()

    if (!trimmed) {
      toast.error('Link cannot be empty')
      return
    }

    try {
      new URL(trimmed)
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    setSubmissionDraftFiles((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        url: trimmed,
        preview: '',
        fileType: 'link',
        name: trimmed,
      },
    ])

    setSubmissionLinkValue('')
    setIsSubmissionLinkModalOpen(false)
    toast.success('Link added')
  }

  const handleRemoveSubmissionDraft = (fileId) => {
    setSubmissionDraftFiles((prev) => prev.filter((item) => item.id !== fileId))
  }

  const handleSubmitAssignment = async () => {
    if (submissionDraftFiles.length === 0) {
      toast.error('Please add at least one file or link')
      return
    }

    try {
      setIsSubmittingAssignment(true)

      await api.post(`/assignments/${assignmentId}/submit`, {
        files: submissionDraftFiles.map((item) => ({
          url: item.url,
          fileType: item.fileType,
          name: item.name,
          preview: item.preview || '',
        })),
      })

      toast.success('Assignment submitted')
      setSubmissionDraftFiles([])
      setIsSubmitModalOpen(false)
      await fetchAssignmentDetail()
    } catch (error) {
      console.error('Failed to submit assignment:', error)
      toast.error(
        error.response?.data?.message || 'Failed to submit assignment',
      )
    } finally {
      setIsSubmittingAssignment(false)
    }
  }

  const handleCancelSubmission = async () => {
    try {
      setIsSubmittingAssignment(true)

      await api.patch(`/assignments/${assignmentId}/cancel-submission`)

      toast.success('Submission cancelled')
      setSubmissionDraftFiles([])
      await fetchAssignmentDetail()
    } catch (error) {
      console.error('Failed to cancel submission:', error)
      toast.error(
        error.response?.data?.message || 'Failed to cancel submission',
      )
    } finally {
      setIsSubmittingAssignment(false)
    }
  }

  const handleCreateComment = async () => {
    if (!commentInput.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    try {
      setIsPostingComment(true)

      const res = await api.post(`/assignments/${assignmentId}/comments`, {
        content: commentInput.trim(),
        parentCommentId: null,
      })

      setComments(res.data?.data || [])
      setCommentInput('')
      toast.success('Comment added')
    } catch (error) {
      console.error('Failed to create comment:', error)
      toast.error(error.response?.data?.message || 'Failed to add comment')
    } finally {
      setIsPostingComment(false)
    }
  }

  const handleCreateReply = async (parentCommentId) => {
    const content = replyDrafts[parentCommentId]?.trim()

    if (!content) {
      toast.error('Reply cannot be empty')
      return
    }

    try {
      setIsPostingComment(true)

      const res = await api.post(`/assignments/${assignmentId}/comments`, {
        content,
        parentCommentId,
      })

      setComments(res.data?.data || [])
      setReplyDrafts((prev) => ({
        ...prev,
        [parentCommentId]: '',
      }))
      setReplyingTo(null)
      setExpandedReplies((prev) => ({
        ...prev,
        [parentCommentId]: true,
      }))
      toast.success('Reply added')
    } catch (error) {
      console.error('Failed to reply comment:', error)
      toast.error(error.response?.data?.message || 'Failed to add reply')
    } finally {
      setIsPostingComment(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      setDeletingCommentId(commentId)

      const res = await api.delete(
        `/assignments/${assignmentId}/comments/${commentId}`,
      )

      setComments(res.data?.data || [])
      toast.success('Comment deleted')
    } catch (error) {
      console.error('Failed to delete comment:', error)
      toast.error(error.response?.data?.message || 'Failed to delete comment')
    } finally {
      setDeletingCommentId(null)
    }
  }

  const authorName = useMemo(() => {
    return (
      assignment?.author?.displayName ||
      assignment?.author?.fullName ||
      assignment?.author?.username ||
      assignment?.author?.email ||
      'Unknown Author'
    )
  }, [assignment])

  const submissionFileInputRef = useRef(null)

  const isTeacherView = useMemo(() => {
    if (!assignment?.class || !user?._id) return false

    const userId = String(user._id)
    const teacherId = String(
      assignment.class.teacher?._id || assignment.class.teacher || '',
    )

    if (teacherId === userId) return true

    return (assignment.class.coTeachers || []).some(
      (teacher) => String(teacher?._id || teacher) === userId,
    )
  }, [assignment, user])

  const attachmentItems = assignment?.teacherFiles || []
  const requiredObjectives = assignment?.requiredObjectives || []
  const bonusObjectives = assignment?.bonusObjectives || []
  const autoRules = assignment?.autoGradingRules || []
  const submissionRules = assignment?.submissionRules || {}
  const commentTree = useMemo(() => buildCommentTree(comments), [comments])

  const submissionPreviewFiles = hasDraftSubmission
    ? submissionDraftFiles
    : existingSubmissionFiles.map((file, index) => ({
        id: `${file.url || 'file'}-${index}`,
        url: file.url,
        preview: file.preview || '',
        fileType: file.fileType || 'file',
        name: file.name || 'Submission file',
      }))

  if (isLoading) {
    return (
      <div className="px-6 py-6">
        <div className="rounded-[32px] border border-violet-100 bg-gradient-to-br from-[#fcfbff] via-[#f8f5ff] to-[#f2f7ff] px-8 py-8 shadow-[0_20px_60px_rgba(124,58,237,0.08)]">
          <div className="h-10 w-60 rounded-xl bg-violet-100" />
          <div className="mt-6 h-48 rounded-[24px] bg-white" />
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="px-6 py-6">
        <div className="rounded-[32px] border border-violet-100 bg-white px-8 py-12 text-center text-slate-500">
          {errorMessage || 'Assignment not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-6">
      <div className="rounded-[32px] border border-violet-100 bg-gradient-to-br from-[#fcfbff] via-[#f8f5ff] to-[#f2f7ff] px-8 pt-8 pb-10 shadow-[0_20px_60px_rgba(124,58,237,0.08)]">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate(`/classes/${classId}/assignments`)}
              className="mt-1 rounded-full bg-white p-3 text-slate-600 shadow-sm transition hover:bg-violet-50 hover:text-violet-700"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-medium text-violet-700">
                <Sparkles className="h-4 w-4" />
                Assignment Detail
              </div>

              <h1 className="text-[36px] font-semibold tracking-[-0.02em] text-slate-900">
                {assignment.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <p>
                  Author{' '}
                  <span className="font-medium text-slate-700">
                    {authorName}
                  </span>
                </p>
                <p>
                  Posted{' '}
                  <span className="font-medium text-slate-700">
                    {formatDate(assignment.assignedAt)}
                  </span>
                </p>
                <p>
                  Due{' '}
                  <span className="font-medium text-slate-700">
                    {formatDate(assignment.dueDate)}
                  </span>
                </p>
                <p>
                  Maximum Score{' '}
                  <span className="font-medium text-slate-700">
                    {assignment.maximumScore || 0}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white/85 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <h2 className="mb-4 text-xl font-semibold text-slate-800">
                Instructions
              </h2>

              <div
                className="prose prose-sm max-w-none text-slate-700 [&_b]:font-bold [&_i]:italic [&_u]:underline [&_s]:line-through [&_ul]:list-disc [&_ul]:pl-5 [&_img]:max-w-full [&_img]:rounded-[14px]"
                dangerouslySetInnerHTML={{
                  __html: assignment.instructions || '<p>No instructions.</p>',
                }}
              />
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white/85 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <h2 className="mb-4 text-xl font-semibold text-slate-800">
                Attachment
              </h2>

              {attachmentItems.length > 0 ? (
                <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
                  {attachmentItems.map((file, index) => {
                    const iconType = getAttachmentIcon(file.fileType, file.url)

                    return (
                      <a
                        key={file.url || index}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                          {iconType === 'image' ? (
                            <ImageIcon className="h-5 w-5" />
                          ) : iconType === 'link' ? (
                            <LinkIcon className="h-5 w-5" />
                          ) : (
                            <FileText className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700">
                            {file.name || 'Attachment'}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {file.fileType || 'file'}
                          </p>
                        </div>
                      </a>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                  No attachment
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white/85 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <div className="space-y-6">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800">
                      Required Objectives
                    </h2>
                  </div>

                  {requiredObjectives.length > 0 ? (
                    <div className="space-y-3">
                      {requiredObjectives.map((item, index) => (
                        <div
                          key={`required-${index}`}
                          className="flex items-center justify-between gap-3 rounded-[16px] border-l-4 border-red-500 bg-slate-50 px-4 py-3"
                        >
                          <p className="text-sm text-slate-700">
                            {item.text || `Required objective ${index + 1}`}
                          </p>
                          <p className="shrink-0 text-sm font-medium text-slate-700">
                            {item.xp || 0} XP / {item.score || 0}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">
                      No required objectives.
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800">
                      Bonus Objectives
                    </h2>
                  </div>

                  {bonusObjectives.length > 0 ? (
                    <div className="space-y-3">
                      {bonusObjectives.map((item, index) => (
                        <div
                          key={`bonus-${index}`}
                          className="flex items-center justify-between gap-3 rounded-[16px] border-l-4 border-violet-500 bg-slate-50 px-4 py-3"
                        >
                          <p className="text-sm text-slate-700">
                            {item.text || `Bonus objective ${index + 1}`}
                          </p>
                          <p className="shrink-0 text-sm font-medium text-slate-700">
                            {item.xp || 0} XP / {item.score || 0}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">
                      No bonus objectives.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white/85 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <div className="mb-4 flex items-center gap-2">
                <MessageCirclePlus className="h-5 w-5 text-violet-600" />
                <h2 className="text-xl font-semibold text-slate-800">
                  Additional Comment
                </h2>
              </div>

              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-[110px] w-full resize-none rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-300"
                />

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCreateComment}
                    disabled={isPostingComment}
                    className="rounded-[14px] bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
                  >
                    Add Comment
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {commentTree.length > 0 ? (
                  commentTree.map((comment) => (
                    <CommentNode
                      key={comment._id}
                      comment={comment}
                      user={user}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                      replyDrafts={replyDrafts}
                      setReplyDrafts={setReplyDrafts}
                      handleCreateReply={handleCreateReply}
                      expandedReplies={expandedReplies}
                      setExpandedReplies={setExpandedReplies}
                      handleDeleteComment={handleDeleteComment}
                      deletingCommentId={deletingCommentId}
                      isPostingComment={isPostingComment}
                    />
                  ))
                ) : (
                  <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                    No comments yet
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-5">
            {!isTeacherView ? (
              <>
                <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-slate-800">
                      Submission
                    </h3>

                    <p className="text-sm font-medium text-slate-500">
                      {assignment.submission?.status === 'evaluated'
                        ? (assignment.submission?.score ?? 0)
                        : 0}{' '}
                      / {assignment.maximumScore || 0}
                    </p>
                  </div>

                  {submissionPreviewFiles.length > 0 ? (
                    <div className="space-y-3">
                      {submissionPreviewFiles.map((file) => (
                        <div
                          key={file.id || file.url}
                          className="flex items-center gap-3 rounded-[16px] bg-slate-100 px-4 py-3"
                        >
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-violet-100 text-violet-700"
                          >
                            {file.fileType === 'image' || file.preview ? (
                              <img
                                src={file.preview || file.url}
                                alt={file.name}
                                className="h-full w-full object-cover"
                              />
                            ) : file.fileType === 'link' ? (
                              <LinkIcon className="h-5 w-5" />
                            ) : (
                              <FileText className="h-5 w-5" />
                            )}
                          </a>

                          <div className="min-w-0 flex-1">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block truncate text-sm font-medium text-slate-800 hover:text-violet-700"
                            >
                              {file.name || 'Submission file'}
                            </a>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {file.fileType || 'file'}
                            </p>
                          </div>

                          {!hasSubmittedAssignment && hasDraftSubmission ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveSubmissionDraft(file.id)
                              }
                              className="rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                      No submission yet
                    </div>
                  )}

                  {!hasSubmittedAssignment ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsSubmitModalOpen(true)}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add file
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmitAssignment}
                        disabled={
                          isSubmittingAssignment ||
                          submissionDraftFiles.length === 0
                        }
                        className="mt-3 w-full rounded-[16px] border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSubmittingAssignment
                          ? 'Submitting...'
                          : 'Submit Assignment'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCancelSubmission}
                      disabled={isSubmittingAssignment}
                      className="mt-4 w-full rounded-[16px] border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmittingAssignment
                        ? 'Cancelling...'
                        : 'Cancel Submission'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsRulesOpen((prev) => !prev)}
                    className="mt-3 ml-auto block text-xs font-medium text-violet-600 transition hover:text-violet-800"
                  >
                    Requirements?
                  </button>
                </section>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isRulesOpen
                      ? 'max-h-[520px] opacity-100'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-5 w-5 text-slate-500" />
                        <h3 className="text-lg font-semibold uppercase tracking-wide text-slate-600">
                          Submission Requirements
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsRulesOpen(false)}
                        className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                      >
                        <ChevronDown className="h-4 w-4 rotate-180" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Allowed File Types
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(submissionRules.allowedFileTypes || []).length >
                          0 ? (
                            submissionRules.allowedFileTypes.map(
                              (type, index) => (
                                <span
                                  key={`${type}-${index}`}
                                  className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                                >
                                  {type}
                                </span>
                              ),
                            )
                          ) : (
                            <span className="text-sm text-slate-400">Any</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-slate-600">
                        <p>
                          Max File Size{' '}
                          <span className="font-medium text-slate-800">
                            {submissionRules.maxFileSize || 0}
                          </span>
                        </p>
                        <p>
                          Max Files{' '}
                          <span className="font-medium text-slate-800">
                            {submissionRules.maxFiles || 0}
                          </span>
                        </p>
                        <p>
                          Format{' '}
                          <span className="font-medium text-slate-800">
                            {(submissionRules.allowedFileTypes || []).length > 0
                              ? 'Restricted'
                              : 'Any'}
                          </span>
                        </p>
                        <p>
                          Naming Format{' '}
                          <span className="font-medium text-slate-800">
                            {submissionRules.namingFormat || 'Any'}
                          </span>
                        </p>
                      </div>

                      <div className="border-t border-slate-200 pt-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-base font-semibold text-slate-800">
                            Auto-Grading Rules
                          </h4>
                          <span className="text-xs text-slate-400">
                            {autoRules.length} rule(s)
                          </span>
                        </div>

                        {autoRules.length > 0 ? (
                          <div className="max-h-[220px] space-y-3 overflow-y-auto pr-1">
                            {autoRules.map((rule, index) => (
                              <div
                                key={`rule-${index}`}
                                className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-700">
                                      {getRuleTypeLabel(rule.ruleType)}
                                    </p>
                                    <p className="mt-1 break-words text-sm text-slate-500">
                                      {rule.value || '-'}
                                    </p>
                                  </div>

                                  <div className="shrink-0 text-right text-sm font-medium text-slate-700">
                                    <p>{rule.score || 0} pts</p>
                                    <p className="text-xs text-slate-400">
                                      {rule.xp || 0} XP
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">
                            No auto-grading rules.
                          </p>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              </>
            ) : (
              <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                  <h3 className="text-lg font-semibold text-slate-800">
                    Teacher View
                  </h3>
                </div>

                <p className="text-sm leading-6 text-slate-500">
                  Submission panel is hidden for teachers.
                </p>

                <button
                  type="button"
                  onClick={() => setIsRulesOpen((prev) => !prev)}
                  className="mt-4 text-sm font-medium text-violet-600 transition hover:text-violet-800"
                >
                  {isRulesOpen ? 'Hide requirements' : 'Show requirements'}
                </button>
              </section>
            )}

            {isTeacherView ? (
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isRulesOpen
                    ? 'max-h-[520px] opacity-100'
                    : 'max-h-0 opacity-0'
                }`}
              >
                <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-5 w-5 text-slate-500" />
                      <h3 className="text-lg font-semibold uppercase tracking-wide text-slate-600">
                        Submission Requirements
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsRulesOpen(false)}
                      className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                      <ChevronDown className="h-4 w-4 rotate-180" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Allowed File Types
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(submissionRules.allowedFileTypes || []).length > 0 ? (
                          submissionRules.allowedFileTypes.map(
                            (type, index) => (
                              <span
                                key={`${type}-${index}`}
                                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                              >
                                {type}
                              </span>
                            ),
                          )
                        ) : (
                          <span className="text-sm text-slate-400">Any</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600">
                      <p>
                        Max File Size{' '}
                        <span className="font-medium text-slate-800">
                          {submissionRules.maxFileSize || 0}
                        </span>
                      </p>
                      <p>
                        Max Files{' '}
                        <span className="font-medium text-slate-800">
                          {submissionRules.maxFiles || 0}
                        </span>
                      </p>
                      <p>
                        Format{' '}
                        <span className="font-medium text-slate-800">
                          {(submissionRules.allowedFileTypes || []).length > 0
                            ? 'Restricted'
                            : 'Any'}
                        </span>
                      </p>
                      <p>
                        Naming Format{' '}
                        <span className="font-medium text-slate-800">
                          {submissionRules.namingFormat || 'Any'}
                        </span>
                      </p>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-base font-semibold text-slate-800">
                          Auto-Grading Rules
                        </h4>
                        <span className="text-xs text-slate-400">
                          {autoRules.length} rule(s)
                        </span>
                      </div>

                      {autoRules.length > 0 ? (
                        <div className="max-h-[220px] space-y-3 overflow-y-auto pr-1">
                          {autoRules.map((rule, index) => (
                            <div
                              key={`rule-${index}`}
                              className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-700">
                                    {getRuleTypeLabel(rule.ruleType)}
                                  </p>
                                  <p className="mt-1 break-words text-sm text-slate-500">
                                    {rule.value || '-'}
                                  </p>
                                </div>

                                <div className="shrink-0 text-right text-sm font-medium text-slate-700">
                                  <p>{rule.score || 0} pts</p>
                                  <p className="text-xs text-slate-400">
                                    {rule.xp || 0} XP
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">
                          No auto-grading rules.
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {!isTeacherView ? (
        <>
          <div
            className={`fixed inset-0 z-[70] bg-black/30 transition ${
              isSubmitModalOpen
                ? 'pointer-events-auto opacity-100'
                : 'pointer-events-none opacity-0'
            }`}
            onClick={() => setIsSubmitModalOpen(false)}
          />

          <div
            className={`fixed inset-0 z-[80] flex items-center justify-center p-4 transition ${
              isSubmitModalOpen
                ? 'pointer-events-auto opacity-100'
                : 'pointer-events-none opacity-0'
            }`}
          >
            <div
              className={`w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)] transition ${
                isSubmitModalOpen
                  ? 'translate-y-0 scale-100'
                  : 'translate-y-4 scale-[0.98]'
              }`}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">
                    Submit Assignment
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Add file from local folder or attach a link.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => submissionFileInputRef.current?.click()}
                    className="flex h-24 w-full items-center justify-center gap-2 rounded-[20px] border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                  >
                    <Upload className="h-5 w-5" />
                    Local file
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSubmissionLinkModalOpen(true)}
                    className="flex h-24 w-full items-center justify-center gap-2 rounded-[20px] border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                  >
                    <LinkIcon className="h-5 w-5" />
                    Attach link
                  </button>

                  <input
                    ref={submissionFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleUploadSubmissionFiles}
                  />

                  <p className="text-xs text-slate-400">
                    {isUploadingSubmissionFile
                      ? 'Uploading file...'
                      : 'You can add multiple files or links before submitting.'}
                  </p>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-base font-semibold text-slate-700">
                      Preview
                    </h4>
                    <span className="text-xs text-slate-400">
                      {submissionDraftFiles.length} item(s)
                    </span>
                  </div>

                  <div className="h-[280px] overflow-y-auto rounded-[20px] border border-slate-200 bg-slate-50 p-3">
                    {submissionDraftFiles.length > 0 ? (
                      <div className="space-y-3">
                        {submissionDraftFiles.map((item) => {
                          const isImage =
                            item.fileType === 'image' ||
                            item.preview ||
                            item.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)

                          return (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 rounded-[16px] border border-slate-200 bg-white px-3 py-3"
                            >
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-violet-100 text-violet-700"
                              >
                                {isImage ? (
                                  <img
                                    src={item.preview || item.url}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : item.fileType === 'link' ? (
                                  <LinkIcon className="h-5 w-5" />
                                ) : (
                                  <FileText className="h-5 w-5" />
                                )}
                              </a>

                              <div className="min-w-0 flex-1">
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block truncate text-sm font-medium text-slate-700 hover:text-violet-700"
                                >
                                  {item.name || item.url}
                                </a>
                                <p className="truncate text-xs text-slate-400">
                                  {item.fileType === 'link'
                                    ? item.url
                                    : item.fileType}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveSubmissionDraft(item.id)
                                }
                                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-[16px] border border-dashed border-slate-200 bg-white text-sm text-slate-400">
                        No file added yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
                >
                  Done
                </button>
              </div>
            </div>
          </div>

          <div
            className={`fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-4 transition ${
              isSubmissionLinkModalOpen
                ? 'pointer-events-auto opacity-100'
                : 'pointer-events-none opacity-0'
            }`}
          >
            <div
              className={`w-full max-w-md rounded-[24px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)] transition ${
                isSubmissionLinkModalOpen
                  ? 'scale-100 translate-y-0'
                  : 'scale-95 translate-y-2'
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  Attach Link
                </h3>

                <button
                  type="button"
                  onClick={() => {
                    setSubmissionLinkValue('')
                    setIsSubmissionLinkModalOpen(false)
                  }}
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mb-3 text-sm text-slate-500">
                Paste a submission link here.
              </p>

              <input
                value={submissionLinkValue}
                onChange={(e) => setSubmissionLinkValue(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white"
              />

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubmissionLinkValue('')
                    setIsSubmissionLinkModalOpen(false)
                  }}
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleAddSubmissionLink}
                  className="rounded-[14px] bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
