import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Search,
  Plus,
  ArrowBigUp,
  Reply,
  Sparkles,
  Tags,
  ArrowUpDown,
} from 'lucide-react'
import api from '../services/api'
import ClassForumModal from '../components/forum/ClassForumModal'

export default function ClassForumPage() {
  const { classId } = useParams()
  const navigate = useNavigate()

  const [forums, setForums] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('all')
  const [selectedSort, setSelectedSort] = useState('recent')
  const [isClassForumModalOpen, setIsClassForumModalOpen] = useState(false)
  const [classData, setClassData] = useState(null)

  const fetchClassInfo = async () => {
    try {
      const res = await api.get(`/classes/${classId}`)
      setClassData(res.data?.data || null)
    } catch (error) {
      console.error('Failed to fetch class info:', error)
      setClassData(null)
    }
  }

  useEffect(() => {
    fetchClassInfo()
  }, [classId])

  const fetchForums = async () => {
    try {
      setIsLoading(true)

      const params = {}

      if (search.trim()) params.search = search
      if (selectedTag !== 'all') params.tag = selectedTag
      if (selectedSort !== 'recent') params.sort = selectedSort

      const res = await api.get(`/classes/${classId}/forum`, { params })

      setForums(res.data?.data || [])
    } catch (error) {
      console.error('Failed to fetch forums:', error)
      setForums([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchForums()
  }, [classId, selectedTag, selectedSort])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchForums()
  }

  const getTagStyle = (tag) => {
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

  const buildAvatarUrl = (avatar) => {
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

  return (
    <div className="px-6 py-6">
      <div className="rounded-[32px] border border-violet-100 bg-gradient-to-br from-[#fcfbff] via-[#f8f5ff] to-[#f2f7ff] px-8 pt-8 pb-8 shadow-[0_20px_60px_rgba(124,58,237,0.08)]">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-medium text-violet-700">
              <Sparkles className="h-4 w-4" />
              Forum Discussion
            </div>

            <h2 className="text-[34px] font-semibold tracking-[-0.02em] text-slate-900">
              Class Forum
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Share announcements, resources, and questions with your class.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsClassForumModalOpen(true)}
            className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">New Thread</span>
          </button>
        </div>

        {/* MAIN */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* LEFT LIST */}
          <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_10px_40px_rgba(15,23,42,0.05)] backdrop-blur">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-800">
                Discussion Threads
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Browse the latest conversations from your class.
              </p>
            </div>

            {isLoading ? (
              <div className="px-6 py-10 text-sm text-slate-400">
                Loading...
              </div>
            ) : forums.length > 0 ? (
              forums.map((item) => (
                <div
                  key={item._id}
                  onClick={() =>
                    navigate(`/classes/${classId}/forum/${item._id}`)
                  }
                  className="group flex cursor-pointer items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 transition hover:bg-violet-50/60 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    {buildAvatarUrl(item.author?.avatar) ? (
                      <img
                        src={buildAvatarUrl(item.author.avatar)}
                        alt={item.author?.displayName || 'User'}
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-200 via-indigo-200 to-sky-200 text-sm font-semibold text-slate-700">
                        {(item.author?.displayName || 'U')
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div
                        className="truncate text-[15px] font-semibold text-slate-800 transition group-hover:text-violet-700 [&_b]:font-bold [&_i]:italic [&_u]:underline"
                        dangerouslySetInnerHTML={{ __html: item.title || '' }}
                      />
                      <p className="mt-1 text-[12px] text-slate-500">
                        {item.author?.displayName || 'User'} •{' '}
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="ml-4 flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[12px] font-medium capitalize ${getTagStyle(
                        item.tag,
                      )}`}
                    >
                      {item.tag}
                    </span>

                    <div className="flex items-center gap-3 text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[12px]">
                        <Reply className="h-3.5 w-3.5" />
                        {item.replyCount || 0}
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[12px]">
                        <ArrowBigUp className="h-3.5 w-3.5" />
                        {item.upvoteCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  No forum threads
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Start the first discussion for this class.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT FILTER */}
          <div className="space-y-5">
            <form
              onSubmit={handleSearch}
              className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur"
            >
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Search className="h-4 w-4 text-violet-500" />
                Search Forum
              </div>

              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search thread title..."
                  className="w-full rounded-[14px] border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white"
                />
                <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <button type="submit" className="hidden" />
            </form>

            <div className="rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Tags className="h-4 w-4 text-emerald-500" />
                Filter by Tag
              </div>

              <div className="flex flex-col gap-2">
                {['all', 'announcement', 'resource', 'question'].map((tag) => {
                  const isActive = selectedTag === tag

                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(tag)}
                      className={`flex items-center justify-between rounded-[14px] px-4 py-3 text-left text-sm transition ${
                        isActive
                          ? 'bg-violet-100 font-semibold text-violet-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="capitalize">{tag}</span>
                      {isActive && (
                        <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ArrowUpDown className="h-4 w-4 text-sky-500" />
                Sort Threads
              </div>

              <div className="flex flex-col gap-2">
                {[
                  { label: 'Recent', value: 'recent' },
                  { label: 'Most Replies', value: 'mostReplies' },
                  { label: 'Least Replies', value: 'leastReplies' },
                ].map((sort) => {
                  const isActive = selectedSort === sort.value

                  return (
                    <button
                      key={sort.value}
                      type="button"
                      onClick={() => setSelectedSort(sort.value)}
                      className={`flex items-center justify-between rounded-[14px] px-4 py-3 text-left text-sm transition ${
                        isActive
                          ? 'bg-sky-100 font-semibold text-sky-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{sort.label}</span>
                      {isActive && (
                        <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ClassForumModal
        isOpen={isClassForumModalOpen}
        onClose={() => setIsClassForumModalOpen(false)}
        classId={classId}
        className={classData?.title || classData?.subject || ''}
        onCreated={fetchForums}
      />
    </div>
  )
}
