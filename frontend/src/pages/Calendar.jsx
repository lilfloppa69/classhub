import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock3,
  BookOpen,
  ClipboardList,
} from 'lucide-react'
import api from '../services/api'

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
})

const selectedDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const pad = (num) => String(num).padStart(2, '0')

const formatDateKey = (value) => {
  const date = new Date(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`
}

const getMonthKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}`

const buildCalendarDays = (viewDate) => {
  const firstDayOfMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1,
  )

  const startGridDate = new Date(firstDayOfMonth)
  startGridDate.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay())

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(startGridDate)
    date.setDate(startGridDate.getDate() + index)

    return {
      date,
      key: formatDateKey(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === viewDate.getMonth(),
    }
  })
}

const getEventTone = (type) => {
  if (type === 'assignment') {
    return {
      badge: 'bg-rose-100 text-rose-700',
      dot: 'bg-rose-500',
      icon: <ClipboardList className="h-4 w-4" />,
      label: 'Assignment',
    }
  }

  return {
    badge: 'bg-violet-100 text-violet-700',
    dot: 'bg-violet-500',
    icon: <BookOpen className="h-4 w-4" />,
    label: 'Class',
  }
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-[24px] border border-black/5 bg-white px-5 py-4 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-black/50">{label}</span>
        <span className="text-black/45">{icon}</span>
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function AgendaItem({ event }) {
  const tone = getEventTone(event.type)

  return (
    <div className="rounded-[20px] border border-black/5 bg-[#FCFCFC] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${tone.badge}`}
          >
            {tone.icon}
            {tone.label}
          </div>

          <h4 className="mt-3 truncate text-[15px] font-semibold text-slate-900">
            {event.title}
          </h4>

          {event.description ? (
            <p className="mt-1 text-sm text-black/55">{event.description}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-black/55">
        {event.startTime || event.endTime ? (
          <div className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4" />
            <span>
              {event.startTime || '--:--'}
              {event.endTime ? ` - ${event.endTime}` : ''}
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>Due on this date</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Calendar() {
  const today = new Date()
  const todayKey = formatDateKey(today)

  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey)
  const [isLoading, setIsLoading] = useState(true)
  const [calendarData, setCalendarData] = useState({
    summary: {
      totalEvents: 0,
      totalClassSessions: 0,
      totalAssignmentDue: 0,
    },
    events: [],
    agendaByDate: {},
    eventCounts: {},
  })

  const monthKey = getMonthKey(viewDate)

  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate])

  const selectedAgenda = useMemo(() => {
    return calendarData.agendaByDate?.[selectedDateKey] || []
  }, [calendarData.agendaByDate, selectedDateKey])

  const upcomingAssignments = useMemo(() => {
    return (calendarData.events || [])
      .filter((event) => event.type === 'assignment' && event.date >= todayKey)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
  }, [calendarData.events, todayKey])

  const selectedDateObject = useMemo(() => {
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    return new Date(year, month - 1, day)
  }, [selectedDateKey])

  const fetchCalendarOverview = async () => {
    try {
      setIsLoading(true)

      const response = await api.get('/calendar/overview', {
        params: { month: monthKey },
      })

      setCalendarData(
        response.data?.data || {
          summary: {
            totalEvents: 0,
            totalClassSessions: 0,
            totalAssignmentDue: 0,
          },
          events: [],
          agendaByDate: {},
          eventCounts: {},
        },
      )
    } catch (error) {
      console.error('FAILED TO FETCH CALENDAR:', error)
      setCalendarData({
        summary: {
          totalEvents: 0,
          totalClassSessions: 0,
          totalAssignmentDue: 0,
        },
        events: [],
        agendaByDate: {},
        eventCounts: {},
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCalendarOverview()
  }, [monthKey])

  const handlePreviousMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleGoToToday = () => {
    const newToday = new Date()
    setViewDate(new Date(newToday.getFullYear(), newToday.getMonth(), 1))
    setSelectedDateKey(formatDateKey(newToday))
  }

  return (
    <div className="space-y-6 px-3 py-4 sm:px-6 sm:py-6">
      <div className="rounded-[32px] bg-[#F8F8F8] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.03em] text-slate-900 sm:text-[34px]">
              Calendar
            </h1>
            <p className="mt-1 text-sm text-black/50 sm:text-base">
              Track class sessions, deadlines, and your agenda in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoToToday}
            className="inline-flex h-11 items-center justify-center rounded-full border border-violet-200 bg-violet-50 px-5 text-sm font-medium text-violet-700 transition hover:bg-violet-100"
          >
            Back to Today
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Total Events"
            value={calendarData.summary?.totalEvents || 0}
            icon={<CalendarDays className="h-5 w-5" />}
          />
          <StatCard
            label="Class Sessions"
            value={calendarData.summary?.totalClassSessions || 0}
            icon={<BookOpen className="h-5 w-5" />}
          />
          <StatCard
            label="Assignment Deadlines"
            value={calendarData.summary?.totalAssignmentDue || 0}
            icon={<ClipboardList className="h-5 w-5" />}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <section className="rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreviousMonth}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 transition hover:bg-slate-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 transition hover:bg-slate-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="text-left sm:text-center">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">
                  {monthFormatter.format(viewDate)}
                </h2>
                <p className="mt-1 text-sm text-black/45">Monthly overview</p>
              </div>

              <div className="hidden sm:block" />
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekdayLabels.map((day) => (
                <div
                  key={day}
                  className="pb-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-black/40 sm:text-sm"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day) => {
                const dateEvents = calendarData.agendaByDate?.[day.key] || []
                const isToday = day.key === todayKey
                const isSelected = day.key === selectedDateKey

                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedDateKey(day.key)}
                    className={`min-h-[110px] rounded-[20px] border p-3 text-left transition-all duration-200 sm:min-h-[124px] ${
                      isSelected
                        ? 'border-violet-300 bg-violet-50 shadow-[0_14px_30px_rgba(109,40,217,0.08)]'
                        : 'border-black/5 bg-[#FCFCFC] hover:border-violet-200 hover:bg-white'
                    } ${day.isCurrentMonth ? 'opacity-100' : 'opacity-45'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                          isToday
                            ? 'bg-slate-900 text-white'
                            : isSelected
                              ? 'bg-violet-600 text-white'
                              : 'bg-transparent text-slate-800'
                        }`}
                      >
                        {day.dayNumber}
                      </span>

                      {dateEvents.length > 0 ? (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                          {dateEvents.length}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 space-y-1">
                      {dateEvents.slice(0, 2).map((event) => {
                        const tone = getEventTone(event.type)

                        return (
                          <div
                            key={event.id}
                            className="flex items-center gap-2 rounded-full bg-white/90 px-2 py-1 text-[11px] text-black/65"
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${tone.dot}`}
                            />
                            <span className="truncate">{event.title}</span>
                          </div>
                        )
                      })}

                      {dateEvents.length > 2 ? (
                        <div className="text-[11px] font-medium text-black/45">
                          +{dateEvents.length - 2} more
                        </div>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:p-6">
              <div className="mb-5">
                <p className="text-sm text-black/45">Selected date</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">
                  {selectedDateFormatter.format(selectedDateObject)}
                </h3>
              </div>

              <div className="space-y-3">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-24 animate-pulse rounded-[20px] bg-slate-100"
                    />
                  ))
                ) : selectedAgenda.length > 0 ? (
                  selectedAgenda.map((event) => (
                    <AgendaItem key={event.id} event={event} />
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-black/10 bg-[#FCFCFC] px-4 py-8 text-center text-sm text-black/45">
                    No agenda for this date
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:p-6">
              <div className="mb-5">
                <p className="text-sm text-black/45">Upcoming</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">
                  Due Dates
                </h3>
              </div>

              <div className="space-y-3">
                {upcomingAssignments.length > 0 ? (
                  upcomingAssignments.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-[18px] border border-black/5 bg-[#FCFCFC] px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {event.title}
                          </p>
                          <p className="mt-1 text-xs text-black/45">
                            {event.description || 'Assignment'}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-rose-100 px-3 py-1 text-[11px] font-medium text-rose-700">
                          {event.date}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-black/10 bg-[#FCFCFC] px-4 py-6 text-center text-sm text-black/45">
                    No upcoming deadlines
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
