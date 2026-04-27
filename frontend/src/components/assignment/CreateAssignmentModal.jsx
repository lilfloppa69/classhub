import { useEffect, useMemo, useRef, useState } from 'react'
import {
  X,
  Plus,
  Link as LinkIcon,
  Upload,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  CalendarDays,
  ChevronDown,
  Trash2,
  FileText,
  Image as ImageIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

function createObjective() {
  return {
    text: '',
    score: '',
    xp: '',
  }
}

function createRule() {
  return {
    ruleType: 'fileName',
    value: '',
    score: '',
    xp: '',
  }
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

function inferFileType(fileOrUrl, mime = '') {
  const input = String(fileOrUrl || '').toLowerCase()

  if (mime.startsWith('image/')) return 'image'
  if (mime.includes('pdf') || input.endsWith('.pdf')) return 'pdf'
  if (
    mime.includes('word') ||
    input.endsWith('.doc') ||
    input.endsWith('.docx')
  ) {
    return 'document'
  }
  if (
    mime.includes('sheet') ||
    input.endsWith('.xls') ||
    input.endsWith('.xlsx') ||
    input.endsWith('.csv')
  ) {
    return 'spreadsheet'
  }
  if (
    mime.includes('presentation') ||
    input.endsWith('.ppt') ||
    input.endsWith('.pptx')
  ) {
    return 'presentation'
  }
  if (input.startsWith('http')) return 'link'
  return 'file'
}

function getRuleLabel(ruleType) {
  switch (ruleType) {
    case 'fileName':
      return 'Exact file name'
    case 'fileFormat':
      return 'Allowed format'
    case 'fileNameAndFormat':
      return 'File name + format'
    case 'fileNumber':
      return 'Expected file count'
    case 'keyword':
      return 'Keyword in title'
    default:
      return 'Value'
  }
}

function normalizeNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function MiniToolbarButton({ title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-slate-200 bg-white text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
    >
      {children}
    </button>
  )
}

function LinkAttachmentModal({
  isOpen,
  value,
  onChange,
  onClose,
  onDone,
  isSubmitting,
}) {
  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-4 transition ${
        isOpen
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0'
      }`}
    >
      <div
        className={`w-full max-w-md rounded-[24px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)] transition ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Attach Link</h3>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-3 text-sm text-slate-500">
          Masukkan link attachment. Bisa Google Drive, Figma, GitHub, atau link
          file publik lainnya.
        </p>

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white"
        />

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onDone}
            disabled={isSubmitting}
            className="rounded-[14px] bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Adding...' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CreateAssignmentModal({
  isOpen,
  onClose,
  classId,
  className = '',
  onCreated,
}) {
  const textareaRef = useRef(null)
  const localFileInputRef = useRef(null)

  const [students, setStudents] = useState([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [linkValue, setLinkValue] = useState('')
  const [existingTopics, setExistingTopics] = useState([])
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [instructions, setInstructions] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [hasDueDate, setHasDueDate] = useState(false)
  const [maximumScore, setMaximumScore] = useState('')
  const [assignMode, setAssignMode] = useState('all')
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [teacherFiles, setTeacherFiles] = useState([])
  const [requiredObjectives, setRequiredObjectives] = useState([
    createObjective(),
  ])
  const [bonusObjectives, setBonusObjectives] = useState([createObjective()])
  const [autoGradingRules, setAutoGradingRules] = useState([createRule()])

  const resetForm = () => {
    setTitle('')
    setTopic('')
    setInstructions('')
    setDueDate('')
    setHasDueDate(false)
    setMaximumScore('')
    setAssignMode('all')
    setSelectedStudentIds([])
    setTeacherFiles([])
    setRequiredObjectives([createObjective()])
    setBonusObjectives([createObjective()])
    setAutoGradingRules([createRule()])
    setIsAssignDropdownOpen(false)
    setIsLinkModalOpen(false)
    setLinkValue('')
  }

  useEffect(() => {
    if (!isOpen || !classId) return

    const fetchClassInfo = async () => {
      try {
        setIsLoadingStudents(true)
        const res = await api.get(`/classes/${classId}`)
        const classData = res.data?.data || {}
        const rawStudents = Array.isArray(classData.students)
          ? classData.students
          : []

        const mappedStudents = rawStudents.map((student) => ({
          _id: student?._id || student?.id || '',
          name:
            student?.displayName ||
            student?.fullName ||
            student?.username ||
            student?.email ||
            'Student',
          email: student?.email || '',
        }))

        setStudents(mappedStudents.filter((student) => student._id))
      } catch (error) {
        console.error('Failed to fetch class students:', error)
        setStudents([])
      } finally {
        setIsLoadingStudents(false)
      }
    }

    const fetchExistingTopics = async () => {
      try {
        const res = await api.get(`/classes/${classId}/assignments`)
        const grouped = res.data?.data || []

        const topics = grouped.map((item) => item.topic).filter(Boolean)

        setExistingTopics(Array.from(new Set(topics)))
      } catch (error) {
        console.error('Failed to fetch existing topics:', error)
        setExistingTopics([])
      }
    }

    fetchClassInfo()
    fetchExistingTopics()
  }, [isOpen, classId])

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  const requiredScoreTotal = useMemo(
    () =>
      requiredObjectives.reduce(
        (sum, item) => sum + normalizeNumber(item.score),
        0,
      ),
    [requiredObjectives],
  )

  const bonusScoreTotal = useMemo(
    () =>
      bonusObjectives.reduce(
        (sum, item) => sum + normalizeNumber(item.score),
        0,
      ),
    [bonusObjectives],
  )

  const ruleScoreTotal = useMemo(
    () =>
      autoGradingRules.reduce(
        (sum, item) => sum + normalizeNumber(item.score),
        0,
      ),
    [autoGradingRules],
  )

  const selectedStudentNames = useMemo(() => {
    if (assignMode === 'all') return 'All students'
    if (selectedStudentIds.length === 0) return 'Select students'

    return students
      .filter((student) => selectedStudentIds.includes(student._id))
      .map((student) => student.name)
      .join(', ')
  }, [assignMode, selectedStudentIds, students])

  const applyFormat = (startTag, endTag) => {
    wrapSelectedText({
      textarea: textareaRef.current,
      value: instructions,
      setValue: setInstructions,
      startTag,
      endTag,
    })
  }

  const handleToggleStudent = (studentId) => {
    setAssignMode('custom')
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    )
  }

  const handleChooseAllStudents = () => {
    setAssignMode('all')
    setSelectedStudentIds([])
  }

  const updateObjective = (setter, index, key, value) => {
    setter((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    )
  }

  const addObjective = (setter, factory) => {
    setter((prev) => [...prev, factory()])
  }

  const removeObjective = (setter, index) => {
    setter((prev) => {
      if (prev.length === 1) return [prev[0]]
      return prev.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const handleAddLinkAttachment = async () => {
    const trimmed = linkValue.trim()

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

    setTeacherFiles((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        url: trimmed,
        preview: '',
        fileType: 'link',
        name: trimmed,
        source: 'link',
      },
    ])

    setLinkValue('')
    setIsLinkModalOpen(false)
  }

  const handleUploadLocalFiles = async (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    try {
      setIsUploadingAttachment(true)

      const uploaded = []

      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const res = await api.post(
          `/classes/${classId}/assignments/upload-file`,
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
          fileType: data.fileType || inferFileType(file.name, file.type),
          name: data.name || file.name,
          source: 'upload',
        })
      }

      setTeacherFiles((prev) => [...prev, ...uploaded])
      toast.success('Attachment uploaded')
    } catch (error) {
      console.error('Failed to upload attachment:', error)
      toast.error(
        error.response?.data?.message ||
          'Attachment upload failed. Add the upload endpoint first.',
      )
    } finally {
      setIsUploadingAttachment(false)
      event.target.value = ''
    }
  }

  const handleRemoveAttachment = (attachmentId) => {
    setTeacherFiles((prev) => prev.filter((item) => item.id !== attachmentId))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!maximumScore || Number(maximumScore) <= 0) {
      toast.error('Maximum score is required')
      return
    }

    if (assignMode === 'custom' && selectedStudentIds.length === 0) {
      toast.error('Please choose at least one student')
      return
    }

    const payload = {
      title: title.trim(),
      topic: topic.trim() || 'General',
      instructions: instructions.trim(),
      dueDate: hasDueDate && dueDate ? dueDate : null,
      maximumScore: Number(maximumScore),
      requiredObjectives: requiredObjectives
        .map((item) => ({
          text: item.text.trim(),
          score: normalizeNumber(item.score),
          xp: normalizeNumber(item.xp),
        }))
        .filter((item) => item.text || item.score || item.xp),
      bonusObjectives: bonusObjectives
        .map((item) => ({
          text: item.text.trim(),
          score: normalizeNumber(item.score),
          xp: normalizeNumber(item.xp),
        }))
        .filter((item) => item.text || item.score || item.xp),
      autoGradingRules: autoGradingRules
        .map((item) => ({
          ruleType: item.ruleType,
          value: item.value.trim(),
          score: normalizeNumber(item.score),
          xp: normalizeNumber(item.xp),
        }))
        .filter((item) => item.value || item.score || item.xp),
      assignedStudents: assignMode === 'all' ? [] : selectedStudentIds,
      teacherFiles: teacherFiles.map((item) => ({
        url: item.url,
        fileType: item.fileType,
        name: item.name,
        preview: item.preview || '',
      })),
    }

    try {
      setIsSubmitting(true)
      await api.post(`/classes/${classId}/assignments`, payload)
      toast.success('Assignment created')
      onCreated?.()
      onClose?.()
    } catch (error) {
      console.error('Failed to create assignment:', error)
      toast.error(
        error.response?.data?.message || 'Failed to create assignment',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] transition ${
          isOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition ${
          isOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          className={`flex h-[92vh] w-full max-w-[1320px] flex-col overflow-hidden rounded-[32px] border border-violet-100 bg-[#f7f6fb] shadow-[0_30px_80px_rgba(15,23,42,0.18)] transition ${
            isOpen ? 'translate-y-0 scale-100' : 'translate-y-4 scale-[0.98]'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-8 py-5">
            <div>
              <h2 className="text-[34px] font-semibold tracking-[-0.02em] text-slate-900">
                Create Assignment
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {className || 'Class assignment'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-3 text-slate-500 transition hover:bg-white hover:text-slate-800"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="min-h-0 flex-1 overflow-y-auto px-8 py-7"
          >
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-5">
                <section className="rounded-[28px] border border-slate-200 bg-white/70 p-6">
                  <h3 className="mb-5 text-xl font-semibold text-slate-800">
                    Basic Info
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Title"
                      className="rounded-[16px] border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300"
                    />

                    <div className="space-y-3">
                      <label className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={hasDueDate}
                          onChange={(e) => {
                            setHasDueDate(e.target.checked)
                            if (!e.target.checked) {
                              setDueDate('')
                            }
                          }}
                          className="h-4 w-4 accent-violet-600"
                        />
                        <span>Set due date</span>
                      </label>

                      {hasDueDate ? (
                        <div className="relative">
                          <input
                            type="datetime-local"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3.5 pr-12 text-sm outline-none transition focus:border-violet-300"
                          />
                          <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        </div>
                      ) : (
                        <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-400">
                          No due date
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <input
                        list="assignment-topic-options"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Topic"
                        className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300"
                      />

                      <datalist id="assignment-topic-options">
                        {existingTopics.map((item) => (
                          <option key={item} value={item} />
                        ))}
                      </datalist>

                      <p className="text-xs text-slate-400">
                        Pilih topic yang sudah ada atau ketik topic baru.
                      </p>
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsAssignDropdownOpen((prev) => !prev)}
                        className="flex w-full items-center justify-between rounded-[16px] border border-slate-200 bg-white px-4 py-3.5 text-left text-sm text-slate-700 transition hover:border-violet-300"
                      >
                        <span className="truncate">
                          {isLoadingStudents
                            ? 'Loading students...'
                            : selectedStudentNames}
                        </span>
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      </button>

                      {isAssignDropdownOpen ? (
                        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-[18px] border border-slate-200 bg-white p-3 shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
                          <button
                            type="button"
                            onClick={handleChooseAllStudents}
                            className={`mb-2 flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-sm transition ${
                              assignMode === 'all'
                                ? 'bg-violet-50 text-violet-700'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <span>All students</span>
                            <input
                              readOnly
                              checked={assignMode === 'all'}
                              type="checkbox"
                              className="h-4 w-4 accent-violet-600"
                            />
                          </button>

                          <div className="max-h-56 overflow-y-auto">
                            {students.map((student) => (
                              <button
                                key={student._id}
                                type="button"
                                onClick={() => handleToggleStudent(student._id)}
                                className={`flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-sm transition ${
                                  selectedStudentIds.includes(student._id)
                                    ? 'bg-violet-50 text-violet-700'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                <div className="min-w-0 text-left">
                                  <p className="truncate font-medium">
                                    {student.name}
                                  </p>
                                  {student.email ? (
                                    <p className="truncate text-xs text-slate-400">
                                      {student.email}
                                    </p>
                                  ) : null}
                                </div>

                                <input
                                  readOnly
                                  checked={selectedStudentIds.includes(
                                    student._id,
                                  )}
                                  type="checkbox"
                                  className="h-4 w-4 accent-violet-600"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[20px] border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-4 py-3">
                      <textarea
                        ref={textareaRef}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Instructions"
                        className="min-h-[220px] w-full resize-none border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
                      />
                    </div>

                    <div className="flex items-center gap-2 px-4 py-3">
                      <MiniToolbarButton
                        title="Bold"
                        onClick={() => applyFormat('<b>', '</b>')}
                      >
                        <Bold className="h-4 w-4" />
                      </MiniToolbarButton>

                      <MiniToolbarButton
                        title="Italic"
                        onClick={() => applyFormat('<i>', '</i>')}
                      >
                        <Italic className="h-4 w-4" />
                      </MiniToolbarButton>

                      <MiniToolbarButton
                        title="Underline"
                        onClick={() => applyFormat('<u>', '</u>')}
                      >
                        <Underline className="h-4 w-4" />
                      </MiniToolbarButton>

                      <MiniToolbarButton
                        title="Bullet list"
                        onClick={() => applyFormat('<ul><li>', '</li></ul>')}
                      >
                        <List className="h-4 w-4" />
                      </MiniToolbarButton>

                      <MiniToolbarButton
                        title="Strikethrough"
                        onClick={() => applyFormat('<s>', '</s>')}
                      >
                        <Strikethrough className="h-4 w-4" />
                      </MiniToolbarButton>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white/70 p-6">
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div>
                      <h3 className="mb-5 text-xl font-semibold text-slate-800">
                        Attachment
                      </h3>

                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => localFileInputRef.current?.click()}
                          className="flex h-28 w-28 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                        >
                          <Upload className="h-9 w-9" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsLinkModalOpen(true)}
                          className="flex h-28 w-28 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                        >
                          <LinkIcon className="h-9 w-9" />
                        </button>

                        <input
                          ref={localFileInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleUploadLocalFiles}
                        />
                      </div>

                      <p className="mt-3 text-xs text-slate-400">
                        {isUploadingAttachment
                          ? 'Uploading attachment...'
                          : 'Upload file from local folder or attach a link.'}
                      </p>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-base font-semibold text-slate-700">
                          Preview of attachment
                        </h4>
                        <span className="text-xs text-slate-400">
                          {teacherFiles.length} item(s)
                        </span>
                      </div>

                      <div className="h-[220px] overflow-y-auto rounded-[20px] border border-slate-200 bg-white p-3">
                        {teacherFiles.length === 0 ? (
                          <div className="flex h-full items-center justify-center rounded-[16px] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                            No attachment yet
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {teacherFiles.map((item) => {
                              const isImage =
                                item.fileType === 'image' ||
                                item.preview ||
                                item.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)

                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-3 rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3"
                                >
                                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-violet-100 text-violet-700">
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
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-700">
                                      {item.name || item.url}
                                    </p>
                                    <p className="truncate text-xs text-slate-400">
                                      {item.fileType === 'link'
                                        ? item.url
                                        : item.fileType}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveAttachment(item.id)
                                    }
                                    className="rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-red-500"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-5">
                <section className="rounded-[28px] border border-slate-200 bg-white/70 p-5">
                  <h3 className="mb-4 text-xl font-semibold text-slate-800">
                    Scoring
                  </h3>

                  <input
                    type="number"
                    min="0"
                    value={maximumScore}
                    onChange={(e) => setMaximumScore(e.target.value)}
                    placeholder="Maximum Score"
                    className="mb-5 w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300"
                  />

                  <div className="space-y-5">
                    <div>
                      <div className="mb-3 flex items-end justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-slate-700">
                            Required Objectives
                          </h4>
                          <p className="text-xs text-slate-400">Optional</p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            addObjective(setRequiredObjectives, createObjective)
                          }
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
                        >
                          + Add Objective
                        </button>
                      </div>

                      <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                        {requiredObjectives.map((item, index) => (
                          <div
                            key={`required-${index}`}
                            className="grid grid-cols-[minmax(0,1fr)_64px_64px_40px] gap-2"
                          >
                            <input
                              value={item.text}
                              onChange={(e) =>
                                updateObjective(
                                  setRequiredObjectives,
                                  index,
                                  'text',
                                  e.target.value,
                                )
                              }
                              placeholder={`OBJ${index + 1}`}
                              className="rounded-[14px] border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                            />
                            <input
                              type="number"
                              min="0"
                              value={item.score}
                              onChange={(e) =>
                                updateObjective(
                                  setRequiredObjectives,
                                  index,
                                  'score',
                                  e.target.value,
                                )
                              }
                              placeholder="Score"
                              className="rounded-[14px] border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                            />
                            <input
                              type="number"
                              min="0"
                              value={item.xp}
                              onChange={(e) =>
                                updateObjective(
                                  setRequiredObjectives,
                                  index,
                                  'xp',
                                  e.target.value,
                                )
                              }
                              placeholder="XP"
                              className="rounded-[14px] border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeObjective(setRequiredObjectives, index)
                              }
                              className="flex items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-500 transition hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-end justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-slate-700">
                            Bonus Objectives
                          </h4>
                          <p className="text-xs text-slate-400">Optional</p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            addObjective(setBonusObjectives, createObjective)
                          }
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
                        >
                          + Add Objective
                        </button>
                      </div>

                      <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                        {bonusObjectives.map((item, index) => (
                          <div
                            key={`bonus-${index}`}
                            className="grid grid-cols-[minmax(0,1fr)_64px_64px_40px] gap-2"
                          >
                            <input
                              value={item.text}
                              onChange={(e) =>
                                updateObjective(
                                  setBonusObjectives,
                                  index,
                                  'text',
                                  e.target.value,
                                )
                              }
                              placeholder={`BOBJ${index + 1}`}
                              className="rounded-[14px] border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                            />
                            <input
                              type="number"
                              min="0"
                              value={item.score}
                              onChange={(e) =>
                                updateObjective(
                                  setBonusObjectives,
                                  index,
                                  'score',
                                  e.target.value,
                                )
                              }
                              placeholder="Score"
                              className="rounded-[14px] border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                            />
                            <input
                              type="number"
                              min="0"
                              value={item.xp}
                              onChange={(e) =>
                                updateObjective(
                                  setBonusObjectives,
                                  index,
                                  'xp',
                                  e.target.value,
                                )
                              }
                              placeholder="XP"
                              className="rounded-[14px] border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeObjective(setBonusObjectives, index)
                              }
                              className="flex items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-500 transition hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[18px] bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      <p>
                        Required {requiredScoreTotal} pts • Bonus{' '}
                        {bonusScoreTotal} pts • Rules {ruleScoreTotal} pts
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Teacher can still override score manually
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white/70 p-5">
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">
                        Auto-Grading Rules
                      </h3>
                      <p className="text-xs text-slate-400">Optional</p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        addObjective(setAutoGradingRules, createRule)
                      }
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
                    >
                      + Add Rule
                    </button>
                  </div>

                  <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                    {autoGradingRules.map((rule, index) => (
                      <div
                        key={`rule-${index}`}
                        className="rounded-[18px] border border-slate-200 bg-white p-3"
                      >
                        <div className="grid grid-cols-1 gap-3">
                          <select
                            value={rule.ruleType}
                            onChange={(e) =>
                              updateObjective(
                                setAutoGradingRules,
                                index,
                                'ruleType',
                                e.target.value,
                              )
                            }
                            className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                          >
                            <option value="fileName">fileName</option>
                            <option value="fileFormat">fileFormat</option>
                            <option value="fileNameAndFormat">
                              fileNameAndFormat
                            </option>
                            <option value="fileNumber">fileNumber</option>
                            <option value="keyword">keyword</option>
                          </select>

                          <input
                            value={rule.value}
                            onChange={(e) =>
                              updateObjective(
                                setAutoGradingRules,
                                index,
                                'value',
                                e.target.value,
                              )
                            }
                            placeholder={getRuleLabel(rule.ruleType)}
                            className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                          />

                          <div className="grid grid-cols-[1fr_1fr_40px] gap-2">
                            <input
                              type="number"
                              min="0"
                              value={rule.score}
                              onChange={(e) =>
                                updateObjective(
                                  setAutoGradingRules,
                                  index,
                                  'score',
                                  e.target.value,
                                )
                              }
                              placeholder="Score"
                              className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                            />

                            <input
                              type="number"
                              min="0"
                              value={rule.xp}
                              onChange={(e) =>
                                updateObjective(
                                  setAutoGradingRules,
                                  index,
                                  'xp',
                                  e.target.value,
                                )
                              }
                              placeholder="XP"
                              className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                removeObjective(setAutoGradingRules, index)
                              }
                              className="flex items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-500 transition hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-[18px] bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    <p>Score preview if all rules pass</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Teacher can still override score manually
                    </p>
                  </div>
                </section>
              </div>
            </div>

            <div className="mt-7 flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-[16px] bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Creating...' : 'Create Assignment'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <LinkAttachmentModal
        isOpen={isLinkModalOpen}
        value={linkValue}
        onChange={setLinkValue}
        onClose={() => {
          setLinkValue('')
          setIsLinkModalOpen(false)
        }}
        onDone={handleAddLinkAttachment}
        isSubmitting={false}
      />
    </>
  )
}
