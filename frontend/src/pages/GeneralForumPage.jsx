import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowBigUp,
  MessageCircle,
  Reply,
  Sparkles,
  Search,
  Tags,
  ArrowUpDown,
  FolderKanban,
  Plus,
  CalendarDays,
  X,
} from 'lucide-react'
import api from '../services/api'
import GeneralForumActionModal from '../components/forum/GeneralForumActionModal'
import CreateGeneralForumModal from '../components/forum/CreateGeneralForumModal'
import JoinGeneralForumModal from '../components/forum/JoinGeneralForumModal'

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

function ForumRow({ item, onClick }) {
  return (
    <div
      onClick={onClick}
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
            {(item.author?.displayName || 'U').charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-slate-800 transition group-hover:text-violet-700">
            {item.title || 'Untitled Forum'}
          </p>

          <p className="mt-1 text-[12px] text-slate-500">
            {item.author?.displayName || 'User'} •{' '}
            {new Date(item.createdAt).toLocaleString()}
            {item.associatedClass?.title
              ? ` • ${item.associatedClass.title}`
              : ''}
          </p>
        </div>
      </div>

      <div className="ml-4 flex shrink-0 items-center gap-3">
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[12px] font-medium capitalize ${getTagStyle(
                item.tag,
              )}`}
            >
              {item.tag}
            </span>

            {item.privacy === 'password' ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[12px] font-medium text-amber-700">
                Locked
              </span>
            ) : null}
          </div>
        </div>

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
  )
}

function ForumSection({ title, description, items, onOpen, isLoading }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_10px_40px_rgba(15,23,42,0.05)] backdrop-blur">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-[28px] font-semibold text-slate-800">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      {isLoading ? (
        <div className="px-6 py-10 text-sm text-slate-400">Loading...</div>
      ) : items.length > 0 ? (
        items.map((item) => (
          <ForumRow key={item._id} item={item} onClick={() => onOpen(item)} />
        ))
      ) : (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <MessageCircle className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-slate-700">No threads yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Nothing to show in this section for now.
          </p>
        </div>
      )}
    </div>
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

export default function GeneralForumPage() {
  const navigate = useNavigate()

  const [forums, setForums] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('all')
  const [selectedSort, setSelectedSort] = useState('recent')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDate, setSelectedDate] = useState('')
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [myClasses, setMyClasses] = useState([])

  const fetchForums = async (customSearch) => {
    try {
      setIsLoading(true)

      const params = {}

      const finalSearch =
        typeof customSearch === 'string' ? customSearch : search

      if (finalSearch.trim()) params.search = finalSearch
      if (selectedTag !== 'all') params.tag = selectedTag
      if (selectedSort !== 'recent') params.sort = selectedSort
      if (selectedCategory !== 'all') params.category = selectedCategory

      const res = await api.get('/forum', { params })
      setForums(res.data?.data || [])
    } catch (error) {
      console.error('Failed to fetch general forums:', error)
      setForums([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMyClasses = async () => {
    try {
      const res = await api.get('/classes/my-classes')
      const raw = res.data?.data || {}

      const merged = [
        ...(raw.teacher || []),
        ...(raw.student || []),
        ...(raw.hybrid || []),
        ...(Array.isArray(raw) ? raw : []),
      ]

      const uniqueMap = new Map()

      merged.forEach((item) => {
        if (!item?._id) return
        uniqueMap.set(item._id, item)
      })

      setMyClasses(Array.from(uniqueMap.values()))
    } catch (error) {
      console.error('Failed to fetch classes for forum modal:', error)
      setMyClasses([])
    }
  }

  useEffect(() => {
    fetchForums()
    fetchMyClasses()
  }, [selectedTag, selectedSort, selectedCategory])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchForums(search)
  }

  const dateFilteredForums = useMemo(() => {
    if (!selectedDate) return forums

    return forums.filter((item) => {
      if (!item.createdAt) return false

      const created = new Date(item.createdAt)
      const year = created.getFullYear()
      const month = String(created.getMonth() + 1).padStart(2, '0')
      const day = String(created.getDate()).padStart(2, '0')
      const formatted = `${year}-${month}-${day}`

      return formatted === selectedDate
    })
  }, [forums, selectedDate])

  const generalForums = useMemo(
    () =>
      dateFilteredForums.filter((item) => item.associationType === 'general'),
    [dateFilteredForums],
  )

  const classForums = useMemo(
    () => dateFilteredForums.filter((item) => item.associationType === 'class'),
    [dateFilteredForums],
  )

  return (
    <div className="px-6 py-6">
      <div className="rounded-[32px] border border-violet-100 bg-gradient-to-br from-[#fcfbff] via-[#f8f5ff] to-[#f2f7ff] px-8 pt-8 pb-8 shadow-[0_20px_60px_rgba(124,58,237,0.08)]">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-medium text-violet-700">
              <Sparkles className="h-4 w-4" />
              Forum Discussion
            </div>

            <h2 className="text-[34px] font-semibold tracking-[-0.02em] text-slate-900">
              Forum
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Explore general discussions and class-connected forums.
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Password forums stay visible but locked. Invite-only forums are
              hidden and can be opened from Join a Forum.
            </p>

            {selectedDate ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-1.5 text-xs font-medium text-rose-700">
                <CalendarDays className="h-3.5 w-3.5" />
                Showing forums from {selectedDate}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setIsActionModalOpen(true)}
            className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">New / Join Forum</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid grid-cols-1 gap-6">
            <ForumSection
              title="General"
              description="Public or joined discussions that are not tied to a specific class."
              items={generalForums}
              isLoading={isLoading}
              onOpen={(item) => navigate(`/forum/${item._id}`)}
            />

            <ForumSection
              title="Classes"
              description="Forums connected to classes you can access."
              items={classForums}
              isLoading={isLoading}
              onOpen={(item) => {
                if (!item?.associatedClass?._id) return
                navigate(
                  `/classes/${item.associatedClass._id}/forum/${item._id}`,
                )
              }}
            />
          </div>

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
                <CalendarDays className="h-4 w-4 text-rose-500" />
                Filter by Date
              </div>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white"
              />

              {selectedDate ? (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[12px] font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear date filter
                </button>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <FolderKanban className="h-4 w-4 text-violet-500" />
                Categories
              </div>

              <div className="flex flex-col gap-2">
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Classes', value: 'classes' },
                  { label: 'General', value: 'general' },
                  { label: 'Private', value: 'private' },
                ].map((category) => {
                  const isActive = selectedCategory === category.value

                  return (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => setSelectedCategory(category.value)}
                      className={`flex items-center justify-between rounded-[14px] px-4 py-3 text-left text-sm transition ${
                        isActive
                          ? 'bg-violet-100 font-semibold text-violet-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{category.label}</span>
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
                          ? 'bg-emerald-100 font-semibold text-emerald-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="capitalize">{tag}</span>
                      {isActive && (
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
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
      <GeneralForumActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onChooseCreate={() => {
          setIsActionModalOpen(false)
          setIsCreateModalOpen(true)
        }}
        onChooseJoin={() => {
          setIsActionModalOpen(false)
          setIsJoinModalOpen(true)
        }}
      />

      <CreateGeneralForumModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={fetchForums}
        classes={myClasses}
      />

      <JoinGeneralForumModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoined={fetchForums}
      />
    </div>
  )
}
