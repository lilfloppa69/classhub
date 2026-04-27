import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Bold, Italic, Underline, Image as ImageIcon, X } from 'lucide-react'
import api from '../../services/api'

const tagOptions = ['question', 'resource', 'announcement']

function ToolbarButton({ onClick, children, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/70 text-slate-700 transition hover:bg-white"
    >
      {children}
    </button>
  )
}

export default function ClassForumModal({
  isOpen,
  onClose,
  classId,
  className,
  onCreated,
  lockedTag = '',
}) {
  const [tag, setTag] = useState(lockedTag || 'question')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const titleRef = useRef(null)
  const descriptionRef = useRef(null)
  const activeEditorRef = useRef('title')
  const scrollBodyRef = useRef(null)

  const isTagLocked = Boolean(lockedTag)

  useEffect(() => {
    if (isOpen) {
      setTag(lockedTag || 'question')
    }
  }, [isOpen, lockedTag])

  if (!isOpen) return null

  const focusEditor = (editor) => {
    activeEditorRef.current = editor
    if (editor === 'title') titleRef.current?.focus()
    if (editor === 'description') descriptionRef.current?.focus()
  }

  const getActiveEditorRef = () =>
    activeEditorRef.current === 'description' ? descriptionRef : titleRef

  const applyFormat = (command) => {
    const editorRef = getActiveEditorRef()
    editorRef.current?.focus()
    document.execCommand(command, false, null)
  }

  const insertImageToDescription = (url) => {
    descriptionRef.current?.focus()
    document.execCommand(
      'insertHTML',
      false,
      `<img src="${url}" alt="forum-uploaded" style="max-width:100%;border-radius:14px;margin:14px 0;" />`,
    )
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    try {
      setIsUploadingImage(true)

      const res = await api.post(
        `/classes/${classId}/forum/upload-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      )

      const uploadedUrl = res.data?.data?.url

      if (!uploadedUrl) {
        toast.error('Image URL not returned')
        return
      }

      insertImageToDescription(uploadedUrl)
      toast.success('Image inserted')
      focusEditor('description')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image')
    } finally {
      setIsUploadingImage(false)
      e.target.value = ''
    }
  }

  const resetForm = () => {
    setTag(lockedTag || 'question')
    if (titleRef.current) titleRef.current.innerHTML = ''
    if (descriptionRef.current) descriptionRef.current.innerHTML = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const title = titleRef.current?.innerHTML?.trim() || ''
    const description = descriptionRef.current?.innerHTML?.trim() || ''

    const plainTitle =
      titleRef.current?.textContent?.replace(/\s+/g, ' ').trim() || ''
    const plainDescription =
      descriptionRef.current?.textContent?.replace(/\s+/g, ' ').trim() || ''

    if (!plainTitle || !plainDescription || !tag) {
      toast.error('Please complete the form')
      return
    }

    try {
      setIsSubmitting(true)

      await api.post(`/classes/${classId}/forum`, {
        title,
        description,
        tag,
      })

      toast.success(
        tag === 'announcement' ? 'Announcement posted' : 'Class forum created',
      )
      resetForm()
      onCreated?.()
      onClose?.()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create forum')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/35 px-4 py-6">
      <div className="flex max-h-[88vh] w-full max-w-[820px] flex-col overflow-hidden rounded-[28px] bg-[#fbfbff] shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
        <div className="shrink-0 bg-gradient-to-r from-[#6857e8] via-[#7d8df2] to-[#64b7e8] px-8 py-6 text-white">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-[28px] font-bold">
                {lockedTag === 'announcement'
                  ? 'Announce Something'
                  : 'Create a Forum'}
              </h2>
              <p className="mt-1 text-sm text-white/80">
                {lockedTag === 'announcement'
                  ? 'Post an announcement directly to your class forum.'
                  : 'Start a discussion, share resources, or ask questions.'}
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
        </div>

        <form
          onSubmit={handleSubmit}
          ref={scrollBodyRef}
          className="overflow-y-auto px-8 py-7"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-[20px] bg-slate-100 p-3">
              <ToolbarButton title="Bold" onClick={() => applyFormat('bold')}>
                <Bold className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                title="Italic"
                onClick={() => applyFormat('italic')}
              >
                <Italic className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                title="Underline"
                onClick={() => applyFormat('underline')}
              >
                <Underline className="h-4 w-4" />
              </ToolbarButton>

              <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[12px] bg-white/70 text-slate-700 transition hover:bg-white">
                <ImageIcon className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {isUploadingImage ? (
                <span className="text-[13px] text-slate-500">Uploading...</span>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-[15px] font-semibold text-slate-800">
                Forum Title
              </label>

              <div
                ref={titleRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => focusEditor('title')}
                data-placeholder={
                  lockedTag === 'announcement'
                    ? 'Announcement title'
                    : 'Forum title'
                }
                className="min-h-[56px] w-full rounded-[18px] border border-slate-200 bg-white px-6 py-4 text-slate-800 outline-none transition empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] focus:border-[#6b57d8]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[15px] font-semibold text-slate-800">
                Description
              </label>

              <div
                ref={descriptionRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => focusEditor('description')}
                data-placeholder={
                  lockedTag === 'announcement'
                    ? 'Write your announcement here...'
                    : 'Description'
                }
                className="min-h-[190px] w-full rounded-[18px] border border-slate-200 bg-white px-6 py-4 text-slate-800 outline-none transition empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] focus:border-[#6b57d8]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[15px] font-semibold text-slate-800">
                Tags
              </label>

              <div className="relative w-[250px]">
                <select
                  value={tag}
                  onChange={(e) => {
                    if (!isTagLocked) setTag(e.target.value)
                  }}
                  disabled={isTagLocked}
                  className={`w-full appearance-none rounded-[18px] border px-6 py-3 capitalize outline-none transition ${
                    isTagLocked
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 blur-[0.4px]'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-[#6b57d8] focus:border-[#6b57d8]'
                  }`}
                >
                  {tagOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                  ▼
                </span>
              </div>

              {isTagLocked ? (
                <p className="mt-2 text-xs text-slate-400">
                  Tag is locked for announcement posts.
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[15px] font-semibold text-slate-800">
                  Associated Class
                </label>
                <input
                  value={className || 'Class forum'}
                  disabled
                  className="w-full cursor-not-allowed rounded-[18px] border border-slate-200 bg-slate-100 px-6 py-3 text-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-[15px] font-semibold text-slate-800">
                  Privacy
                </label>

                <div className="flex items-center rounded-[18px] bg-slate-100 p-1">
                  <button
                    type="button"
                    className="rounded-[14px] bg-white px-6 py-2 text-[15px] font-medium text-slate-800 shadow-sm"
                  >
                    Public
                  </button>

                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed px-6 py-2 text-[15px] text-slate-400 blur-[0.6px]"
                  >
                    Password
                  </button>

                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed px-6 py-2 text-[15px] text-slate-400 blur-[0.6px]"
                  >
                    Invite
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4 border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[18px] bg-[#6b57d8] px-10 py-4 text-[16px] font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? 'Creating...'
                : lockedTag === 'announcement'
                  ? 'Post Announcement'
                  : 'Create Forum'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-[18px] px-7 py-4 text-[15px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
