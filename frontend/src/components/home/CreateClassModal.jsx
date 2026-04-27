import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClass } from '../../services/classService'

const dayOptions = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

function FieldLabel({ children }) {
  return (
    <label className="mb-2 block text-sm font-semibold text-slate-700">
      {children}
    </label>
  )
}

export default function CreateClassModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    subject: '',
    description: '',
    schedule: [
      {
        day: 'Monday',
        startTime: '',
        endTime: '',
      },
    ],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))
  }

  const handleScheduleChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      schedule: prev.schedule.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }))
  }

  const handleAddSchedule = () => {
    setForm((prev) => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        {
          day: 'Monday',
          startTime: '',
          endTime: '',
        },
      ],
    }))
  }

  const handleRemoveSchedule = (index) => {
    setForm((prev) => ({
      ...prev,
      schedule:
        prev.schedule.length === 1
          ? prev.schedule
          : prev.schedule.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const cleanSchedule = form.schedule
      .map((item) => ({
        day: item.day,
        startTime: item.startTime,
        endTime: item.endTime,
      }))
      .filter((item) => item.day && item.startTime && item.endTime)

    if (!form.title.trim()) {
      toast.error('Class title is required')
      return
    }

    if (!form.subject.trim()) {
      toast.error('Subject is required')
      return
    }

    if (cleanSchedule.length === 0) {
      toast.error('At least one complete schedule is required')
      return
    }

    try {
      setIsSubmitting(true)

      const createdClass = await createClass({
        title: form.title.trim(),
        subject: form.subject.trim(),
        description: form.description.trim(),
        schedule: cleanSchedule,
      })

      toast.success('Class created successfully')
      onCreated?.(createdClass)
      onClose?.()
    } catch (error) {
      console.error('Failed to create class:', error)
      toast.error(error.response?.data?.message || 'Failed to create class')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/35 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-6 bg-gradient-to-r from-[#4e83f1] via-[#6b57d8] to-[#69b2e2] px-7 py-6 text-white">
          <div>
            <h2 className="text-[28px] font-bold">Create Class</h2>
            <p className="mt-1 text-sm text-white/80">
              Set up your class, subject, and meeting schedule.
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

        <form onSubmit={handleSubmit} className="overflow-y-auto px-7 py-7">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <FieldLabel>Class Title</FieldLabel>
              <input
                value={form.title}
                onChange={handleChange('title')}
                placeholder="Example: XI Science A"
                className="h-12 w-full rounded-[16px] border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#4e83f1]"
              />
            </div>

            <div>
              <FieldLabel>Subject</FieldLabel>
              <input
                value={form.subject}
                onChange={handleChange('subject')}
                placeholder="Example: Mathematics"
                className="h-12 w-full rounded-[16px] border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#4e83f1]"
              />
            </div>

            <div className="md:col-span-2">
              <FieldLabel>Description</FieldLabel>
              <textarea
                value={form.description}
                onChange={handleChange('description')}
                placeholder="Short description about this class..."
                className="min-h-[110px] w-full resize-none rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4e83f1]"
              />
            </div>
          </div>

          <div className="mt-7 rounded-[24px] bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-[17px] font-semibold text-slate-900">
                  Schedule
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add one or more meeting times.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddSchedule}
                className="inline-flex items-center gap-2 rounded-[14px] bg-[#4e83f1] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {form.schedule.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-3 rounded-[18px] bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <select
                    value={item.day}
                    onChange={(e) =>
                      handleScheduleChange(index, 'day', e.target.value)
                    }
                    className="h-11 rounded-[14px] border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#4e83f1]"
                  >
                    {dayOptions.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>

                  <input
                    type="time"
                    value={item.startTime}
                    onChange={(e) =>
                      handleScheduleChange(index, 'startTime', e.target.value)
                    }
                    className="h-11 rounded-[14px] border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#4e83f1]"
                  />

                  <input
                    type="time"
                    value={item.endTime}
                    onChange={(e) =>
                      handleScheduleChange(index, 'endTime', e.target.value)
                    }
                    className="h-11 rounded-[14px] border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#4e83f1]"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveSchedule(index)}
                    disabled={form.schedule.length === 1}
                    className="flex h-11 w-11 items-center justify-center rounded-[14px] text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-7 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[16px] px-5 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[16px] bg-[#4e83f1] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
