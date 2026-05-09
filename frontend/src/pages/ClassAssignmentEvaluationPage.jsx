import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  FileText,
  ClipboardCheck,
  PencilLine,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  History,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

function formatDateTime(date) {
  if (!date) return '-'

  return new Date(date).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getDisplayName(student) {
  return (
    student?.displayName ||
    student?.fullName ||
    student?.username ||
    student?.email ||
    'Student'
  )
}

function getRuleLabel(ruleType) {
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

function getCleanUrl(url = '') {
  return String(url).split('?')[0].split('#')[0].toLowerCase()
}

function getFileName(file) {
  return String(file?.name || file?.originalName || file?.filename || '')
}

function getFileType(file) {
  return String(
    file?.fileType || file?.mimeType || file?.mimetype || '',
  ).toLowerCase()
}

function getFileExtension(file) {
  const name = getFileName(file).toLowerCase()
  const cleanUrl = getCleanUrl(file?.url || '')

  const source = name || cleanUrl
  const match = source.match(/\.([a-z0-9]+)$/i)

  return match?.[1] || ''
}

function buildFileUrl(url = '') {
  if (!url) return ''

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  const apiBase =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:3000/api'

  const originOnly = apiBase.replace(/\/+$/, '').replace(/\/api$/, '')
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`

  return `${originOnly}${normalizedUrl}`
}

function getPreviewFileUrl(file) {
  return buildFileUrl(file?.previewUrl || file?.url || '')
}

function getDownloadFileUrl(file) {
  return buildFileUrl(file?.downloadUrl || file?.url || '')
}

function isPdfFile(file) {
  const type = getFileType(file)
  const ext = getFileExtension(file)

  return type === 'pdf' || type === 'application/pdf' || ext === 'pdf'
}

function isImageFile(file) {
  const type = getFileType(file)
  const ext = getFileExtension(file)

  return (
    type === 'image' ||
    type.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
  )
}

function isBrowserPreviewableFile(file) {
  return isImageFile(file) || isPdfFile(file)
}

function buildInitialChecks(items = [], source = []) {
  return items.map((_, index) => {
    if (Array.isArray(source) && typeof source[index] === 'boolean') {
      return source[index]
    }
    return true
  })
}

export default function ClassAssignmentEvaluationPage() {
  const navigate = useNavigate()
  const { classId, assignmentId } = useParams()

  const [assignmentDetail, setAssignmentDetail] = useState(null)
  const [students, setStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedStudentSubmission, setSelectedStudentSubmission] =
    useState(null)

  const [isLoadingAssignment, setIsLoadingAssignment] = useState(true)
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(true)

  const [activeRightTab, setActiveRightTab] = useState('file')
  const [selectedFileIndex, setSelectedFileIndex] = useState(0)
  const [imageZoom, setImageZoom] = useState(1)
  const [pdfPage, setPdfPage] = useState(1)

  const [requiredChecks, setRequiredChecks] = useState([])
  const [bonusChecks, setBonusChecks] = useState([])
  const [autoRuleChecks, setAutoRuleChecks] = useState([])
  const [autoRulesEnabled, setAutoRulesEnabled] = useState(true)

  const [manualScoreInput, setManualScoreInput] = useState('')
  const [manualXpInput, setManualXpInput] = useState('')
  const [privateComment, setPrivateComment] = useState('')

  const [isReturnedLocked, setIsReturnedLocked] = useState(false)
  const [isReturning, setIsReturning] = useState(false)

  const [isEvaluateAllModalOpen, setIsEvaluateAllModalOpen] = useState(false)
  const [evaluateAllScore, setEvaluateAllScore] = useState('')
  const [evaluateAllXp, setEvaluateAllXp] = useState('')
  const [isEvaluatingAll, setIsEvaluatingAll] = useState(false)

  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  const fetchAssignmentMeta = async () => {
    try {
      setIsLoadingAssignment(true)
      const res = await api.get(`/assignments/${assignmentId}`)
      setAssignmentDetail(res.data?.data || null)
    } catch (error) {
      console.error('Failed to fetch assignment meta:', error)
      setAssignmentDetail(null)
    } finally {
      setIsLoadingAssignment(false)
    }
  }

  const fetchStudents = async () => {
    try {
      setIsLoadingStudents(true)
      const res = await api.get(`/assignments/${assignmentId}/students`)
      const data = res.data?.data || []
      setStudents(data)

      if (data.length > 0) {
        setSelectedStudentId((prev) => prev || data[0].studentId)
      }
    } catch (error) {
      console.error('Failed to fetch assignment students:', error)
      setStudents([])
    } finally {
      setIsLoadingStudents(false)
    }
  }

  const fetchSubmissionForStudent = async (studentId) => {
    if (!studentId) return

    try {
      setIsLoadingSubmission(true)
      const res = await api.get(
        `/assignments/${assignmentId}/submission/${studentId}`,
      )
      const data = res.data?.data || null
      setSelectedStudentSubmission(data)
      setSelectedFileIndex(0)
      setImageZoom(1)
      setPdfPage(1)

      const evaluation = data?.evaluation || {}

      setRequiredChecks(
        buildInitialChecks(
          data?.requiredObjectives || [],
          evaluation.requiredObjectives,
        ),
      )
      setBonusChecks(
        buildInitialChecks(
          data?.bonusObjectives || [],
          evaluation.bonusObjectives,
        ),
      )
      setAutoRuleChecks(
        buildInitialChecks(data?.autoGradingRules || [], evaluation.autoRules),
      )
      setAutoRulesEnabled(!evaluation.autoGradingDisabled)
      setManualScoreInput(data?.score ? String(data.score) : '')
      setManualXpInput(data?.xp ? String(data.xp) : '')
      setPrivateComment(evaluation.teacherComment || '')
      setIsReturnedLocked(data?.status === 'evaluated')
    } catch (error) {
      console.error('Failed to fetch submission for evaluation:', error)
      setSelectedStudentSubmission(null)
      setRequiredChecks([])
      setBonusChecks([])
      setAutoRuleChecks([])
      setAutoRulesEnabled(true)
      setManualScoreInput('')
      setManualXpInput('')
      setPrivateComment('')
      setIsReturnedLocked(false)
    } finally {
      setIsLoadingSubmission(false)
    }
  }

  useEffect(() => {
    fetchAssignmentMeta()
    fetchStudents()
  }, [assignmentId])

  useEffect(() => {
    if (selectedStudentId) {
      fetchSubmissionForStudent(selectedStudentId)
    }
  }, [selectedStudentId])

  const selectedStudentIndex = useMemo(
    () =>
      students.findIndex((student) => student.studentId === selectedStudentId),
    [students, selectedStudentId],
  )

  const currentStudent = useMemo(
    () =>
      students.find((student) => student.studentId === selectedStudentId) ||
      null,
    [students, selectedStudentId],
  )

  const submittedFiles = selectedStudentSubmission?.files || []
  const currentFile = submittedFiles[selectedFileIndex] || null

  const requiredObjectives = selectedStudentSubmission?.requiredObjectives || []
  const bonusObjectives = selectedStudentSubmission?.bonusObjectives || []
  const autoGradingRules = selectedStudentSubmission?.autoGradingRules || []
  const activityHistory = selectedStudentSubmission?.activityHistory || []

  const autoRuleMatchesFromSystem = useMemo(() => {
    const evaluation = selectedStudentSubmission?.evaluation || {}
    return buildInitialChecks(autoGradingRules, evaluation.autoRules)
  }, [selectedStudentSubmission, autoGradingRules])

  const effectiveAutoRuleChecks = useMemo(() => {
    if (!autoRulesEnabled) {
      return autoRuleMatchesFromSystem.map(() => false)
    }
    return autoRuleMatchesFromSystem
  }, [autoRuleMatchesFromSystem, autoRulesEnabled])

  const autoScore = useMemo(() => {
    return autoGradingRules.reduce((sum, rule, index) => {
      if (!effectiveAutoRuleChecks[index]) return sum
      return sum + Number(rule.score || 0)
    }, 0)
  }, [autoGradingRules, effectiveAutoRuleChecks])

  const autoXp = useMemo(() => {
    return autoGradingRules.reduce((sum, rule, index) => {
      if (!effectiveAutoRuleChecks[index]) return sum
      return sum + Number(rule.xp || 0)
    }, 0)
  }, [autoGradingRules, effectiveAutoRuleChecks])

  const requiredScore = useMemo(() => {
    return requiredObjectives.reduce((sum, item, index) => {
      if (!requiredChecks[index]) return sum
      return sum + Number(item.score || 0)
    }, 0)
  }, [requiredObjectives, requiredChecks])

  const requiredXp = useMemo(() => {
    return requiredObjectives.reduce((sum, item, index) => {
      if (!requiredChecks[index]) return sum
      return sum + Number(item.xp || 0)
    }, 0)
  }, [requiredObjectives, requiredChecks])

  const bonusScore = useMemo(() => {
    return bonusObjectives.reduce((sum, item, index) => {
      if (!bonusChecks[index]) return sum
      return sum + Number(item.score || 0)
    }, 0)
  }, [bonusObjectives, bonusChecks])

  const bonusXp = useMemo(() => {
    return bonusObjectives.reduce((sum, item, index) => {
      if (!bonusChecks[index]) return sum
      return sum + Number(item.xp || 0)
    }, 0)
  }, [bonusObjectives, bonusChecks])

  const computedScore = requiredScore + bonusScore + autoScore
  const computedXp = requiredXp + bonusXp + autoXp

  const maximumScore =
    selectedStudentSubmission?.maximumScore ||
    assignmentDetail?.maximumScore ||
    0

  const normalizedPreviewScore = Math.min(computedScore, maximumScore)
  const normalizedPreviewXp = Math.max(computedXp, 0)

  const hasManualScoreOverride = manualScoreInput !== ''
  const hasManualXpOverride = manualXpInput !== ''

  const finalScoreValue = hasManualScoreOverride
    ? Number(manualScoreInput || 0)
    : normalizedPreviewScore

  const finalXpValue = hasManualXpOverride
    ? Number(manualXpInput || 0)
    : normalizedPreviewXp

  const cappedFinalScore = Math.min(Math.max(finalScoreValue, 0), maximumScore)
  const cappedFinalXp = Math.max(finalXpValue, 0)

  const scoreAdjustment = cappedFinalScore - normalizedPreviewScore
  const xpAdjustment = cappedFinalXp - normalizedPreviewXp

  const canReturn =
    !isReturnedLocked && !!selectedStudentId && cappedFinalScore >= 0

  const handlePrevStudent = () => {
    if (selectedStudentIndex <= 0) return
    setSelectedStudentId(students[selectedStudentIndex - 1]?.studentId || '')
  }

  const handleNextStudent = () => {
    if (
      selectedStudentIndex === -1 ||
      selectedStudentIndex >= students.length - 1
    )
      return
    setSelectedStudentId(students[selectedStudentIndex + 1]?.studentId || '')
  }

  const handlePrevFile = () => {
    if (selectedFileIndex <= 0) return
    setSelectedFileIndex((prev) => prev - 1)
    setImageZoom(1)
    setPdfPage(1)
  }

  const handleNextFile = () => {
    if (selectedFileIndex >= submittedFiles.length - 1) return
    setSelectedFileIndex((prev) => prev + 1)
    setImageZoom(1)
    setPdfPage(1)
  }

  const handleToggleAutoRulesEnabled = () => {
    if (isReturnedLocked) return
    setAutoRulesEnabled((prev) => !prev)
  }

  const handleReturn = async () => {
    if (!selectedStudentId) return

    try {
      setIsReturning(true)

      await api.post(
        `/assignments/${assignmentId}/evaluate/${selectedStudentId}`,
        {
          checkedObjectives: requiredChecks
            .map((checked, index) => (checked ? index : null))
            .filter((value) => value !== null),
          checkedBonusObjectives: bonusChecks
            .map((checked, index) => (checked ? index : null))
            .filter((value) => value !== null),
          autoGradingDisabled: !autoRulesEnabled,
          overrideScore: cappedFinalScore,
          overrideXP: cappedFinalXp,
          comment: privateComment,
        },
      )

      toast.success('Submission returned')
      setIsReturnedLocked(true)
      await fetchSubmissionForStudent(selectedStudentId)
      await fetchStudents()
    } catch (error) {
      console.error('Failed to return submission:', error)
      toast.error(
        error.response?.data?.message || 'Failed to return submission',
      )
    } finally {
      setIsReturning(false)
    }
  }

  const handleCancelReturned = async () => {
    if (!selectedStudentId) return

    try {
      setIsReturning(true)

      await api.patch(
        `/assignments/${assignmentId}/evaluate/${selectedStudentId}/cancel`,
      )

      toast.success('Returned submission cancelled')
      setIsReturnedLocked(false)
      await fetchSubmissionForStudent(selectedStudentId)
      await fetchStudents()
    } catch (error) {
      console.error('Failed to cancel returned submission:', error)
      toast.error(
        error.response?.data?.message || 'Failed to cancel returned submission',
      )
    } finally {
      setIsReturning(false)
    }
  }

  const handleEvaluateAll = async () => {
    try {
      setIsEvaluatingAll(true)

      await api.post(`/assignments/${assignmentId}/evaluate-all`, {
        score: Number(evaluateAllScore || 0),
        xp: Number(evaluateAllXp || 0),
      })

      toast.success('All submissions evaluated')
      setIsEvaluateAllModalOpen(false)
      setEvaluateAllScore('')
      setEvaluateAllXp('')
      await fetchStudents()
      if (selectedStudentId) {
        await fetchSubmissionForStudent(selectedStudentId)
      }
    } catch (error) {
      console.error('Failed to evaluate all submissions:', error)
      toast.error(
        error.response?.data?.message || 'Failed to evaluate all submissions',
      )
    } finally {
      setIsEvaluatingAll(false)
    }
  }

  const handleDownloadCurrentFile = () => {
    const downloadUrl = getDownloadFileUrl(currentFile)

    if (!downloadUrl) {
      toast.error('File URL not available')
      return
    }

    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = getFileName(currentFile) || 'submitted-file'
    link.rel = 'noreferrer'

    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handleOpenCurrentFile = () => {
    const previewUrl = getPreviewFileUrl(currentFile)

    if (!previewUrl) {
      toast.error('File URL not available')
      return
    }

    window.open(previewUrl, '_blank', 'noopener,noreferrer')
  }

  const filePreviewUrl = useMemo(() => {
    if (!currentFile) return ''

    return getPreviewFileUrl(currentFile)
  }, [currentFile])

  const isBusy = isLoadingAssignment || isLoadingStudents || isLoadingSubmission

  return (
    <div className="px-6 py-6">
      <div className="rounded-[32px] border border-violet-100 bg-gradient-to-br from-[#fcfbff] via-[#f8f5ff] to-[#f2f7ff] px-8 pt-8 pb-10 shadow-[0_20px_60px_rgba(124,58,237,0.08)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-semibold tracking-[-0.02em] text-slate-900">
              {assignmentDetail?.title || 'Assignment Name'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/classes/${classId}/assignments`)}
              className="rounded-[14px] bg-violet-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-violet-600"
            >
              Back
            </button>

            <button
              type="button"
              onClick={() => setIsEvaluateAllModalOpen(true)}
              className="rounded-[14px] bg-violet-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-violet-600"
            >
              Evaluate All
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative w-full max-w-[570px]">
            <button
              type="button"
              onClick={() => setIsStudentDropdownOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-[16px] border border-slate-200 bg-slate-100 px-6 py-4 text-left"
            >
              <div className="min-w-0">
                <p className="truncate text-lg font-medium text-slate-800">
                  {currentStudent
                    ? `${getDisplayName(currentStudent)} (${currentStudent.status})`
                    : 'Select student to check'}
                </p>
                <p className="truncate text-sm text-slate-500">
                  status: submitted or assigned depends
                </p>
              </div>

              <ChevronDown className="h-5 w-5 text-slate-500" />
            </button>

            {isStudentDropdownOpen ? (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-72 overflow-y-auto rounded-[18px] border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
                {students.map((student) => (
                  <button
                    key={student.studentId}
                    type="button"
                    onClick={() => {
                      setSelectedStudentId(student.studentId)
                      setIsStudentDropdownOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-[12px] px-4 py-3 text-left transition ${
                      selectedStudentId === student.studentId
                        ? 'bg-violet-50 text-violet-700'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {getDisplayName(student)}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {student.status}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevStudent}
              className="rounded-full bg-white p-3 text-slate-700 shadow-sm transition hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"
              disabled={selectedStudentIndex <= 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={handleNextStudent}
              className="rounded-full bg-white p-3 text-slate-700 shadow-sm transition hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"
              disabled={
                selectedStudentIndex === -1 ||
                selectedStudentIndex >= students.length - 1
              }
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {!isReturnedLocked ? (
              <button
                type="button"
                onClick={handleReturn}
                disabled={!canReturn || isReturning}
                className="rounded-[14px] bg-violet-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isReturning ? 'Returning...' : 'Return'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelReturned}
                className="rounded-[14px] border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
          <section className="rounded-[28px] border border-slate-200 bg-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-end px-5 pt-5">
              {currentFile ? (
                <button
                  type="button"
                  onClick={handleDownloadCurrentFile}
                  className="rounded-full bg-white p-3 text-slate-700 shadow-sm transition hover:bg-violet-50 hover:text-violet-700"
                  title="Download file"
                >
                  <Download className="h-5 w-5" />
                </button>
              ) : null}
            </div>

            <div className="relative min-h-[620px] overflow-hidden px-5 pb-5">
              {submittedFiles.length > 0 && currentFile ? (
                <>
                  <button
                    type="button"
                    onClick={handlePrevFile}
                    disabled={selectedFileIndex <= 0}
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 text-slate-700 shadow-sm transition hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextFile}
                    disabled={selectedFileIndex >= submittedFiles.length - 1}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 text-slate-700 shadow-sm transition hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <div className="h-[760px] overflow-auto rounded-[22px] border border-slate-200 bg-slate-50">
                    {isImageFile(currentFile) ? (
                      <div className="flex min-h-full items-center justify-center p-6">
                        <img
                          src={filePreviewUrl}
                          alt={getFileName(currentFile) || 'Submitted file'}
                          className="max-w-full transition"
                          style={{
                            transform: `scale(${imageZoom})`,
                            transformOrigin: 'center center',
                          }}
                          onError={() => {
                            toast.error('Failed to preview image')
                          }}
                        />
                      </div>
                    ) : isPdfFile(currentFile) ? (
                      <object
                        key={filePreviewUrl}
                        data={`${filePreviewUrl}#toolbar=0`}
                        type="application/pdf"
                        className="h-full w-full bg-white"
                      >
                        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                          <FileText className="h-16 w-16 text-slate-400" />
                          <div>
                            <p className="text-lg font-semibold text-slate-700">
                              {getFileName(currentFile) || 'PDF Preview'}
                            </p>
                            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                              PDF tidak bisa di-preview di browser ini.
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={handleOpenCurrentFile}
                              className="rounded-[14px] border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                            >
                              Open file
                            </button>
                            <button
                              type="button"
                              onClick={handleDownloadCurrentFile}
                              className="inline-flex items-center gap-2 rounded-[14px] bg-violet-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-600"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </button>
                          </div>
                        </div>
                      </object>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                        <FileText className="h-16 w-16 text-slate-400" />

                        <div>
                          <p className="text-lg font-semibold text-slate-700">
                            {getFileName(currentFile) || 'File Review'}
                          </p>

                          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                            This file type cannot be previewed safely in the
                            browser. Open or download it manually.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={handleOpenCurrentFile}
                            className="rounded-[14px] border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                          >
                            Open file
                          </button>

                          <button
                            type="button"
                            onClick={handleDownloadCurrentFile}
                            className="inline-flex items-center gap-2 rounded-[14px] bg-violet-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-600"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isImageFile(currentFile) ? (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setImageZoom((prev) => Math.max(0.5, prev - 0.2))
                          }
                          className="rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setImageZoom(1)}
                          className="rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setImageZoom((prev) => prev + 0.2)}
                          className="rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex h-[560px] items-center justify-center rounded-[22px] border border-dashed border-slate-200 bg-slate-50 text-lg font-medium text-slate-400">
                  File Review
                </div>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="grid grid-cols-[44px_minmax(0,1fr)] min-h-[720px]">
              <div className="border-r border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setActiveRightTab('file')}
                  className={`flex h-16 w-full items-center justify-center transition ${
                    activeRightTab === 'file'
                      ? 'bg-white text-violet-700'
                      : 'text-slate-500 hover:bg-white'
                  }`}
                >
                  <ClipboardCheck className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRightTab('evaluation')}
                  className={`flex h-16 w-full items-center justify-center transition ${
                    activeRightTab === 'evaluation'
                      ? 'bg-white text-violet-700'
                      : 'text-slate-500 hover:bg-white'
                  }`}
                >
                  <PencilLine className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                {activeRightTab === 'file' ? (
                  <div>
                    <h3 className="mb-6 text-xl font-semibold text-slate-900">
                      File
                    </h3>

                    <div className="space-y-4 text-sm text-slate-700">
                      <p>
                        Due Date:{' '}
                        <span className="font-medium text-slate-900">
                          {formatDateTime(selectedStudentSubmission?.dueDate)}
                        </span>
                      </p>

                      <button
                        type="button"
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="font-medium text-blue-600 transition hover:text-blue-800"
                      >
                        Activity History
                      </button>
                    </div>

                    <div className="mt-6 max-h-[360px] space-y-3 overflow-y-auto pr-1">
                      {submittedFiles.length > 0 ? (
                        submittedFiles.map((file, index) => (
                          <button
                            key={file.url || index}
                            type="button"
                            onClick={() => {
                              setSelectedFileIndex(index)
                              setImageZoom(1)
                              setPdfPage(1)
                            }}
                            className={`block w-full rounded-[16px] px-4 py-4 text-left transition ${
                              index === selectedFileIndex
                                ? 'bg-violet-50 ring-1 ring-violet-200'
                                : 'bg-slate-100 hover:bg-slate-200'
                            }`}
                          >
                            <p className="truncate text-base font-medium text-slate-800">
                              {file.name || 'Submitted File'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {file.fileType || 'file'}
                            </p>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                          No submitted file
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="mb-6 text-xl font-semibold text-slate-900">
                      Evaluation
                    </h3>

                    <div
                      className={`${isReturnedLocked ? 'pointer-events-none opacity-60' : ''}`}
                    >
                      <div className="space-y-6">
                        <div>
                          <h4 className="mb-3 text-base font-semibold text-slate-800">
                            Required Objectives
                          </h4>

                          <div className="space-y-3">
                            {requiredObjectives.map((item, index) => (
                              <div
                                key={`required-${index}`}
                                className="grid grid-cols-[1fr_88px_88px_40px] items-center gap-2 rounded-[16px] bg-slate-50 px-3 py-3"
                              >
                                <p className="text-sm text-slate-700">
                                  {item.text ||
                                    `Required objective ${index + 1}`}
                                </p>

                                <input
                                  type="number"
                                  value={item.score || 0}
                                  readOnly
                                  className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                                />

                                <input
                                  type="number"
                                  value={item.xp || 0}
                                  readOnly
                                  className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                                />

                                <input
                                  type="checkbox"
                                  checked={!!requiredChecks[index]}
                                  onChange={() =>
                                    setRequiredChecks((prev) =>
                                      prev.map((value, i) =>
                                        i === index ? !value : value,
                                      ),
                                    )
                                  }
                                  className="h-5 w-5 accent-violet-600"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-3 text-base font-semibold text-slate-800">
                            Bonus Objectives
                          </h4>

                          <div className="space-y-3">
                            {bonusObjectives.map((item, index) => (
                              <div
                                key={`bonus-${index}`}
                                className="grid grid-cols-[1fr_88px_88px_40px] items-center gap-2 rounded-[16px] bg-slate-50 px-3 py-3"
                              >
                                <p className="text-sm text-slate-700">
                                  {item.text || `Bonus objective ${index + 1}`}
                                </p>

                                <input
                                  type="number"
                                  value={item.score || 0}
                                  readOnly
                                  className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                                />

                                <input
                                  type="number"
                                  value={item.xp || 0}
                                  readOnly
                                  className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                                />

                                <input
                                  type="checkbox"
                                  checked={!!bonusChecks[index]}
                                  onChange={() =>
                                    setBonusChecks((prev) =>
                                      prev.map((value, i) =>
                                        i === index ? !value : value,
                                      ),
                                    )
                                  }
                                  className="h-5 w-5 accent-violet-600"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-base font-semibold text-slate-800">
                              Auto Grading Rules
                            </h4>

                            <label className="flex items-center gap-2 text-sm text-slate-600">
                              <span>Auto grading</span>
                              <button
                                type="button"
                                onClick={handleToggleAutoRulesEnabled}
                                className={`relative h-7 w-12 rounded-full transition ${
                                  autoRulesEnabled
                                    ? 'bg-violet-500'
                                    : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                                    autoRulesEnabled ? 'left-6' : 'left-1'
                                  }`}
                                />
                              </button>
                            </label>
                          </div>

                          <div className="space-y-3">
                            {autoGradingRules.map((rule, index) => {
                              const matchedBySystem =
                                !!autoRuleMatchesFromSystem[index]

                              return (
                                <div
                                  key={`auto-${index}`}
                                  className={`grid grid-cols-[1fr_88px_88px_40px] items-center gap-2 rounded-[16px] px-3 py-3 transition duration-300 ${
                                    matchedBySystem
                                      ? 'bg-violet-50 ring-1 ring-violet-200'
                                      : 'bg-slate-50'
                                  } ${!autoRulesEnabled ? 'opacity-50' : ''}`}
                                  style={{
                                    transitionDelay: `${index * 90}ms`,
                                  }}
                                >
                                  <div>
                                    <p className="text-sm font-medium text-slate-800">
                                      {getRuleLabel(rule.ruleType)}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {rule.value || '-'}
                                    </p>
                                  </div>

                                  <input
                                    type="number"
                                    value={rule.score || 0}
                                    readOnly
                                    className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                                  />

                                  <input
                                    type="number"
                                    value={rule.xp || 0}
                                    readOnly
                                    className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                                  />

                                  <input
                                    type="checkbox"
                                    checked={matchedBySystem}
                                    readOnly
                                    disabled
                                    className="h-5 w-5 accent-violet-600"
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-slate-800">
                              System Preview
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Auto-calculated from checked objectives and active
                              auto-grading.
                            </p>
                          </div>

                          <div className="space-y-2 rounded-[16px] bg-white px-4 py-4">
                            <div className="flex items-center justify-between text-sm text-slate-600">
                              <span>Required Objectives</span>
                              <span className="font-medium text-slate-800">
                                {requiredScore}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-sm text-slate-600">
                              <span>Bonus Objectives</span>
                              <span className="font-medium text-slate-800">
                                {bonusScore}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-sm text-slate-600">
                              <span>Auto-Grading</span>
                              <span className="font-medium text-slate-800">
                                {autoScore}
                              </span>
                            </div>

                            <div className="border-t border-slate-200 pt-2">
                              <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                                <span>Preview Score</span>
                                <span>
                                  {normalizedPreviewScore} / {maximumScore}
                                </span>
                              </div>

                              <div className="mt-2 flex items-center justify-between text-sm font-semibold text-slate-800">
                                <span>Preview XP</span>
                                <span>{normalizedPreviewXp}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-5">
                            <p className="mb-3 text-sm font-semibold text-slate-800">
                              Final Result
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                                  Final Score
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max={maximumScore}
                                  value={manualScoreInput}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    if (value === '') {
                                      setManualScoreInput('')
                                      return
                                    }

                                    const next = Number(value)
                                    setManualScoreInput(
                                      String(
                                        next > maximumScore
                                          ? maximumScore
                                          : next,
                                      ),
                                    )
                                  }}
                                  placeholder={String(normalizedPreviewScore)}
                                  className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-300"
                                />
                              </div>

                              <div>
                                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                                  Final XP
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={manualXpInput}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    if (value === '') {
                                      setManualXpInput('')
                                      return
                                    }

                                    const next = Number(value)
                                    setManualXpInput(
                                      String(next < 0 ? 0 : next),
                                    )
                                  }}
                                  placeholder={String(normalizedPreviewXp)}
                                  className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-300"
                                />
                              </div>
                            </div>

                            <div className="mt-4 rounded-[16px] bg-white px-4 py-4">
                              <div className="flex items-center justify-between text-sm text-slate-600">
                                <span>Final Score</span>
                                <span className="font-semibold text-slate-900">
                                  {cappedFinalScore} / {maximumScore}
                                </span>
                              </div>

                              <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                                <span>Score Adjustment</span>
                                <span
                                  className={`font-medium ${
                                    scoreAdjustment > 0
                                      ? 'text-emerald-600'
                                      : scoreAdjustment < 0
                                        ? 'text-red-600'
                                        : 'text-slate-500'
                                  }`}
                                >
                                  {scoreAdjustment > 0
                                    ? `+${scoreAdjustment}`
                                    : scoreAdjustment}
                                </span>
                              </div>

                              <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                                <span>Final XP</span>
                                <span className="font-semibold text-slate-900">
                                  {cappedFinalXp}
                                </span>
                              </div>

                              <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                                <span>XP Adjustment</span>
                                <span
                                  className={`font-medium ${
                                    xpAdjustment > 0
                                      ? 'text-emerald-600'
                                      : xpAdjustment < 0
                                        ? 'text-red-600'
                                        : 'text-slate-500'
                                  }`}
                                >
                                  {xpAdjustment > 0
                                    ? `+${xpAdjustment}`
                                    : xpAdjustment}
                                </span>
                              </div>
                            </div>

                            <p className="mt-3 text-xs text-slate-400">
                              Leave the fields empty to use the system preview
                              as the final result.
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-3 text-base font-semibold text-slate-800">
                            Private Comment
                          </h4>

                          <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-400">
                            Not available since the developer is lazy to make
                            the endpoint.
                          </div>
                        </div>
                      </div>
                    </div>

                    {isReturnedLocked ? (
                      <p className="mt-4 text-xs text-slate-400">
                        Evaluation is locked after return.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[70] bg-black/30 transition ${
          isEvaluateAllModalOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsEvaluateAllModalOpen(false)}
      />

      <div
        className={`fixed inset-0 z-[80] flex items-center justify-center p-4 transition ${
          isEvaluateAllModalOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          className={`w-full max-w-md rounded-[24px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)] transition ${
            isEvaluateAllModalOpen
              ? 'translate-y-0 scale-100'
              : 'translate-y-4 scale-[0.98]'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">
              Evaluate All
            </h3>

            <button
              type="button"
              onClick={() => setIsEvaluateAllModalOpen(false)}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mb-4 text-sm text-slate-500">
            Set one score and XP for all submissions. Maximum score is{' '}
            {maximumScore}.
          </p>

          <div className="space-y-3">
            <input
              type="number"
              value={evaluateAllScore}
              onChange={(e) => setEvaluateAllScore(e.target.value)}
              placeholder="Score"
              className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-300 focus:bg-white"
            />

            <input
              type="number"
              value={evaluateAllXp}
              onChange={(e) => setEvaluateAllXp(e.target.value)}
              placeholder="XP"
              className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-300 focus:bg-white"
            />
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEvaluateAllModalOpen(false)}
              className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleEvaluateAll}
              disabled={isEvaluatingAll}
              className="rounded-[14px] bg-violet-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-600 disabled:opacity-50"
            >
              {isEvaluatingAll ? 'Evaluating...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[90] bg-black/30 transition ${
          isHistoryModalOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsHistoryModalOpen(false)}
      />

      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition ${
          isHistoryModalOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          className={`w-full max-w-lg rounded-[24px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)] transition ${
            isHistoryModalOpen
              ? 'translate-y-0 scale-100'
              : 'translate-y-4 scale-[0.98]'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-violet-600" />
              <h3 className="text-xl font-semibold text-slate-900">
                Activity History
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(false)}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
            {activityHistory.length > 0 ? (
              activityHistory.map((item, index) => (
                <div
                  key={`${item.type}-${index}`}
                  className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <p className="text-sm font-medium capitalize text-slate-800">
                    {item.type}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(item.date)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                No activity history
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
