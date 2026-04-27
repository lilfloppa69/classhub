import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Bold, Italic, Underline, Image as ImageIcon } from 'lucide-react'
import api from '../../services/api'

const tagOptions = ['question', 'resource', 'announcement']

function ToolbarButton({ onClick, children, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#D9D9D9] text-black transition hover:bg-black/10"
    >
      {children}
    </button>
  )
}

export default function EditClassForumModal({
  isOpen,
  onClose,
  classId,
  forumId,
  className,
  initialTitle,
  initialDescription,
  initialTag,
  onUpdated,
}) {
  const [tag, setTag] = useState(initialTag || 'question')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const titleRef = useRef(null)
  const descriptionRef = useRef(null)
  const activeEditorRef = useRef('title')

  useEffect(() => {
    if (!isOpen) return

    setTag(initialTag || 'question')

    if (titleRef.current) {
      titleRef.current.innerHTML = initialTitle || ''
    }

    if (descriptionRef.current) {
      descriptionRef.current.innerHTML = initialDescription || ''
    }
  }, [isOpen, initialTitle, initialDescription, initialTag])

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

  const insertImageToDescription = (url) => {
    descriptionRef.current?.focus()
    document.execCommand(
      'insertHTML',
      false,
      `<img src="${url}" alt="forum-uploaded" style="max-width:100%;border-radius:12px;margin:12px 0;" />`,
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

      await api.put(`/classes/${classId}/forum/${forumId}`, {
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
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/25 px-4 py-6">
      <div className="flex max-h-[88vh] w-full max-w-[780px] flex-col overflow-hidden rounded-[20px] bg-[#F7F7F7] shadow-xl">
        <div className="shrink-0 bg-[#D7BDB9] px-12 py-7">
          <h2 className="text-[28px] font-bold text-white">Edit Thread</h2>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-12 py-8">
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

              <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[12px] bg-[#D9D9D9] text-black transition hover:bg-black/10">
                <ImageIcon className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {isUploadingImage ? (
                <span className="text-[13px] text-black/55">Uploading...</span>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-[16px] font-medium text-black">
                Forum Title
              </label>

              <div
                ref={titleRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => focusEditor('title')}
                data-placeholder="Forum title"
                className="min-h-[56px] w-full rounded-[18px] bg-[#D9D9D9] px-6 py-4 outline-none empty:before:text-black/40 empty:before:content-[attr(data-placeholder)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[16px] font-medium text-black">
                Description
              </label>

              <div
                ref={descriptionRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => focusEditor('description')}
                data-placeholder="Description"
                className="min-h-[180px] w-full rounded-[18px] bg-[#D9D9D9] px-6 py-4 outline-none empty:before:text-black/40 empty:before:content-[attr(data-placeholder)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[16px] font-medium text-black">
                Tags
              </label>
              <div className="relative w-[240px]">
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full appearance-none rounded-[18px] bg-[#D9D9D9] px-6 py-3 capitalize outline-none"
                >
                  {tagOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-black/70">
                  ▼
                </span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[16px] font-medium text-black">
                Associated Class
              </label>
              <input
                value={className || 'Class forum'}
                disabled
                className="w-full cursor-not-allowed rounded-[18px] bg-[#D9D9D9] px-6 py-3 text-black/65 outline-none"
              />
            </div>
          </div>

          <div className="mt-9 flex items-center gap-4 pb-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[18px] bg-[#94BC59] px-12 py-4 text-[18px] font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-[18px] px-8 py-4 text-[16px] text-black/60 transition hover:bg-black/5"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
