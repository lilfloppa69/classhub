import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Bold, Italic, Underline, Image as ImageIcon, X } from 'lucide-react'
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

export default function CreateGeneralForumModal({
  isOpen,
  onClose,
  onCreated,
  classes = [],
}) {
  const [tag, setTag] = useState('question')
  const [privacy, setPrivacy] = useState('public')
  const [associatedClass, setAssociatedClass] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const titleRef = useRef(null)
  const descriptionRef = useRef(null)
  const activeEditorRef = useRef('title')

  const associationType = associatedClass ? 'class' : 'general'
  const classOptions = useMemo(() => classes || [], [classes])

  useEffect(() => {
    if (!isOpen) return
    setTag('question')
    setPrivacy('public')
    setAssociatedClass('')
    setPassword('')
    if (titleRef.current) titleRef.current.innerHTML = ''
    if (descriptionRef.current) descriptionRef.current.innerHTML = ''
  }, [isOpen])

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

    if (privacy === 'password' && !password.trim()) {
      toast.error('Password is required for password forum')
      return
    }

    try {
      setIsSubmitting(true)

      await api.post('/forum', {
        title,
        description,
        tag,
        privacy,
        associationType,
        associatedClass: associatedClass || null,
        password: privacy === 'password' ? password : '',
      })

      toast.success('Forum created')
      onCreated?.()
      onClose?.()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create forum')
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
              Create a Forum
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create a general forum or connect it to a class.
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

              <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[12px] border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700">
                <ImageIcon className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    try {
                      const formData = new FormData()
                      formData.append('file', file)

                      const res = await api.post(
                        '/forum/upload-image',
                        formData,
                        {
                          headers: {
                            'Content-Type': 'multipart/form-data',
                          },
                        },
                      )

                      const imageUrl = res.data?.data?.url
                      if (!imageUrl) {
                        toast.error('Failed to upload image')
                        return
                      }

                      const editorRef =
                        activeEditorRef.current === 'description'
                          ? descriptionRef
                          : titleRef

                      editorRef.current?.focus()
                      document.execCommand(
                        'insertHTML',
                        false,
                        `<img src="${imageUrl}" alt="forum-upload" />`,
                      )
                      toast.success('Image uploaded')
                    } catch (error) {
                      toast.error(
                        error.response?.data?.message ||
                          'Failed to upload image',
                      )
                    } finally {
                      e.target.value = ''
                    }
                  }}
                />
              </label>
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
                  onChange={(e) => setPrivacy(e.target.value)}
                  className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 capitalize outline-none"
                >
                  {privacyOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Associated Class
                </label>

                <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-2">
                  <select
                    size={Math.min(Math.max(classOptions.length + 1, 1), 6)}
                    value={associatedClass}
                    onChange={(e) => setAssociatedClass(e.target.value)}
                    className="max-h-[220px] w-full rounded-[12px] bg-white px-3 py-2 outline-none"
                  >
                    <option value="">General Forum</option>
                    {classOptions.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.title || item.subject || 'Class'}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Leave empty to create a general forum. Select a class to
                  connect this forum to it.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Password
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={privacy !== 'password'}
                  placeholder={
                    privacy === 'password'
                      ? 'Enter forum password'
                      : 'Only used for password forum'
                  }
                  className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[16px] bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-sm font-medium text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Creating...' : 'Create Forum'}
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
