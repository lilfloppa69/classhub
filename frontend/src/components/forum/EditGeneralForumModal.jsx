import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Bold, Italic, Underline, X } from 'lucide-react'
import api from '../../services/api'

const tagOptions = ['question', 'resource', 'announcement']
const privacyOptions = ['public', 'password', 'invite']

function ToolbarButton({ onClick, children, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
    >
      {children}
    </button>
  )
}

export default function EditGeneralForumModal({
  isOpen,
  onClose,
  forumId,
  initialTitle = '',
  initialDescription = '',
  initialTag = 'question',
  initialPrivacy = 'public',
  onUpdated,
}) {
  const [tag, setTag] = useState(initialTag)
  const [privacy, setPrivacy] = useState(initialPrivacy)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [titlePreview, setTitlePreview] = useState(initialTitle || '')
  const [descriptionPreview, setDescriptionPreview] = useState(
    initialDescription || '',
  )

  const titleRef = useRef(null)
  const descriptionRef = useRef(null)
  const activeEditorRef = useRef('title')

  const privacyOptionsSafe = useMemo(() => privacyOptions, [])

  useEffect(() => {
    if (!isOpen) return

    setTag(initialTag || 'question')
    setPrivacy(initialPrivacy || 'public')
    setTitlePreview(initialTitle || '')
    setDescriptionPreview(initialDescription || '')

    if (titleRef.current) {
      titleRef.current.innerHTML = initialTitle || ''
    }

    if (descriptionRef.current) {
      descriptionRef.current.innerHTML = initialDescription || ''
    }
  }, [isOpen, initialTitle, initialDescription, initialTag, initialPrivacy])

  if (!isOpen) return null

  const focusEditor = (editor) => {
    activeEditorRef.current = editor
    if (editor === 'title') titleRef.current?.focus()
    if (editor === 'description') descriptionRef.current?.focus()
  }

  const getActiveEditorRef = () => {
    return activeEditorRef.current === 'description' ? descriptionRef : titleRef
  }

  const applyFormat = (command) => {
    const editorRef = getActiveEditorRef()
    editorRef.current?.focus()
    document.execCommand(command, false, null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const title = titleRef.current?.innerHTML?.trim() || ''
    const description = descriptionRef.current?.innerHTML?.trim() || ''

    const plainTitle =
      titleRef.current?.textContent?.replace(/\s+/g, ' ').trim() || ''
    const plainDescription =
      descriptionRef.current?.textContent?.replace(/\s+/g, ' ').trim() || ''

    if (!plainTitle || !plainDescription) {
      toast.error('Please complete the form')
      return
    }

    try {
      setIsSubmitting(true)

      await api.put(`/forum/${forumId}`, {
        title,
        description,
        tag,
      })

      toast.success('Forum updated')
      onUpdated?.()
      onClose?.()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update forum')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
          <div>
            <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-slate-900">
              Edit Forum
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update your forum title, description, and tag.
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

        <form onSubmit={handleSubmit} className="overflow-y-auto px-8 py-7">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
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
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800">
                Forum Title
              </label>
              <div
                ref={titleRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => focusEditor('title')}
                onInput={(e) => setTitlePreview(e.currentTarget.innerHTML)}
                data-placeholder="Forum title"
                className="min-h-[60px] w-full rounded-[18px] border border-slate-200 bg-slate-50 px-5 py-4 outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800">
                Description
              </label>
              <div
                ref={descriptionRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => focusEditor('description')}
                onInput={(e) =>
                  setDescriptionPreview(e.currentTarget.innerHTML)
                }
                data-placeholder="Description"
                className="min-h-[180px] w-full rounded-[18px] border border-slate-200 bg-slate-50 px-5 py-4 outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Tag
                </label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 capitalize outline-none"
                >
                  {tagOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Privacy
                </label>
                <select
                  value={privacy}
                  disabled
                  onChange={(e) => setPrivacy(e.target.value)}
                  className="w-full cursor-not-allowed rounded-[16px] border border-slate-200 bg-slate-100 px-4 py-3 capitalize outline-none opacity-70"
                >
                  {privacyOptionsSafe.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-5">
                  <p className="mb-3 text-sm font-semibold text-slate-800">
                    Preview
                  </p>

                  <div
                    className="text-[22px] font-semibold tracking-[-0.02em] text-slate-900 [&_b]:font-bold [&_i]:italic [&_u]:underline [&_img]:mt-3 [&_img]:max-w-full [&_img]:rounded-[12px]"
                    dangerouslySetInnerHTML={{
                      __html:
                        titlePreview ||
                        '<span class="text-slate-400">Forum title preview</span>',
                    }}
                  />

                  <div
                    className="mt-4 text-[15px] leading-7 text-slate-700 [&_b]:font-bold [&_i]:italic [&_u]:underline [&_img]:mt-3 [&_img]:max-w-full [&_img]:rounded-[12px]"
                    dangerouslySetInnerHTML={{
                      __html:
                        descriptionPreview ||
                        '<span class="text-slate-400">Description preview</span>',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[16px] bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-sm font-medium text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-[16px] px-5 py-3 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
