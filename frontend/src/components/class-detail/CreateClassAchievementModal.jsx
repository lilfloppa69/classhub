import { useMemo, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createClassAchievement,
  giveClassAchievementEarly,
} from '../../services/achievementService'

const triggerOptions = [
  {
    label: 'Create Forum Posts',
    value: 'create_forum',
  },
  {
    label: 'Reply Forum Discussions',
    value: 'reply_forum',
  },
  {
    label: 'Receive Forum Upvotes',
    value: 'get_forum_upvote',
  },
  {
    label: 'Submit Assignments',
    value: 'submit_assignment',
  },
]

function FieldLabel({ children }) {
  return (
    <label className="mb-2 block text-sm font-medium text-slate-700">
      {children}
    </label>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="h-12 w-full rounded-[14px] border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#4e83f1]"
    />
  )
}

function SelectInput({ value, onChange, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="h-12 w-full appearance-none rounded-[14px] border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-[#4e83f1]"
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

export default function CreateClassAchievementModal({
  isOpen,
  onClose,
  classId,
  students = [],
  onCreated,
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    icon: '',
    trigger: 'create_forum',
    conditionValue: 1,
    rewardXP: 100,
    rewardPoints: 5,
    giveEarlyTo: [],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedStudents = useMemo(
    () =>
      students.filter((student) =>
        form.giveEarlyTo.includes(String(student._id)),
      ),
    [students, form.giveEarlyTo],
  )

  if (!isOpen) return null

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))
  }

  const handleNumberChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: Number(e.target.value),
    }))
  }

  const handleToggleStudent = (studentId) => {
    const normalizedId = String(studentId)

    setForm((prev) => {
      const alreadySelected = prev.giveEarlyTo.includes(normalizedId)

      return {
        ...prev,
        giveEarlyTo: alreadySelected
          ? prev.giveEarlyTo.filter((id) => id !== normalizedId)
          : [...prev.giveEarlyTo, normalizedId],
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.title.trim()) {
      toast.error('Achievement title is required')
      return
    }

    if (!form.description.trim()) {
      toast.error('Achievement description is required')
      return
    }

    if (!form.trigger) {
      toast.error('Trigger is required')
      return
    }

    if (Number(form.conditionValue) <= 0) {
      toast.error('Condition value must be greater than 0')
      return
    }

    try {
      setIsSubmitting(true)

      const achievement = await createClassAchievement(classId, {
        title: form.title.trim(),
        description: form.description.trim(),
        icon: form.icon.trim(),
        trigger: form.trigger,
        conditionValue: Number(form.conditionValue),
        rewardXP: Number(form.rewardXP || 0),
        rewardPoints: Number(form.rewardPoints || 0),
      })

      if (form.giveEarlyTo.length > 0 && achievement?._id) {
        try {
          await giveClassAchievementEarly(
            classId,
            achievement._id,
            form.giveEarlyTo,
          )
        } catch (error) {
          console.warn('Give early endpoint is not ready yet:', error)
          toast.error(
            'Achievement created, but give early is not connected yet',
          )
        }
      }

      toast.success('Class achievement created')

      onCreated?.(achievement)
      onClose()
    } catch (error) {
      console.error('Failed to create class achievement:', error)
      toast.error(
        error.response?.data?.message || 'Failed to create achievement',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-[640px] overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.2)]">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-[24px] font-semibold text-slate-900">
              Create Class Achievement
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Set a custom milestone for students in this class.
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

        <form
          onSubmit={handleSubmit}
          className="max-h-[75vh] overflow-y-auto px-6 py-6"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <FieldLabel>Title</FieldLabel>
              <TextInput
                value={form.title}
                onChange={handleChange('title')}
                placeholder="Example: Discussion Champion"
              />
            </div>

            <div className="md:col-span-2">
              <FieldLabel>Description</FieldLabel>
              <textarea
                value={form.description}
                onChange={handleChange('description')}
                placeholder="Describe what students need to do."
                className="min-h-[110px] w-full resize-none rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#4e83f1]"
              />
            </div>

            <div>
              <FieldLabel>Icon</FieldLabel>
              <TextInput
                value={form.icon}
                onChange={handleChange('icon')}
                placeholder="Emoji or icon text, optional"
              />
            </div>

            <div>
              <FieldLabel>Trigger</FieldLabel>
              <SelectInput
                value={form.trigger}
                onChange={handleChange('trigger')}
              >
                {triggerOptions.map((trigger) => (
                  <option key={trigger.value} value={trigger.value}>
                    {trigger.label}
                  </option>
                ))}
              </SelectInput>
            </div>

            <div>
              <FieldLabel>Condition Value</FieldLabel>
              <TextInput
                type="number"
                value={form.conditionValue}
                onChange={handleNumberChange('conditionValue')}
                placeholder="Example: 5"
              />
            </div>

            <div>
              <FieldLabel>Reward XP</FieldLabel>
              <TextInput
                type="number"
                value={form.rewardXP}
                onChange={handleNumberChange('rewardXP')}
                placeholder="Example: 150"
              />
            </div>

            <div>
              <FieldLabel>Reward Points</FieldLabel>
              <TextInput
                type="number"
                value={form.rewardPoints}
                onChange={handleNumberChange('rewardPoints')}
                placeholder="Example: 10"
              />
            </div>
          </div>

          <div className="mt-7 rounded-[22px] border border-dashed border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-1">
              <h3 className="text-[16px] font-semibold text-slate-900">
                Give it early to
              </h3>
              <p className="text-sm text-slate-500">
                Optional. Select students who should receive this achievement
                immediately.
              </p>
            </div>

            <div className="mt-4 max-h-[190px] space-y-2 overflow-y-auto pr-1">
              {students.length > 0 ? (
                students.map((student) => {
                  const studentId = String(student._id)
                  const isSelected = form.giveEarlyTo.includes(studentId)

                  return (
                    <label
                      key={studentId}
                      className={`flex cursor-pointer items-center justify-between rounded-[16px] px-4 py-3 transition ${
                        isSelected
                          ? 'bg-[#4e83f1] text-white'
                          : 'bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {student.displayName ||
                            student.fullName ||
                            student.username ||
                            'Unnamed Student'}
                        </p>
                        <p
                          className={`mt-0.5 text-xs ${
                            isSelected ? 'text-white/75' : 'text-slate-400'
                          }`}
                        >
                          {student.email || student.username || 'Student'}
                        </p>
                      </div>

                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleStudent(studentId)}
                        className="h-4 w-4 accent-[#4e83f1]"
                      />
                    </label>
                  )
                })
              ) : (
                <p className="rounded-[16px] bg-white px-4 py-5 text-center text-sm text-slate-400">
                  No students found for early grant.
                </p>
              )}
            </div>

            {selectedStudents.length > 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                Selected: {selectedStudents.length} student
                {selectedStudents.length > 1 ? 's' : ''}
              </p>
            ) : null}
          </div>

          <div className="mt-7 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[14px] px-5 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[14px] bg-[#4e83f1] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Creating...' : 'Create Achievement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
