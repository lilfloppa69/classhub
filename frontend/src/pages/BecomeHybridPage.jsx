import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const specializationCategories = {
  academic: [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'History',
    'Literature',
    'Economics',
    'Geography',
    'Sociology',
    'Psychology',
    'Philosophy',
    'Political Science',
    'Anthropology',
    'Linguistics',
    'Statistics',
  ],
  skill: [
    'Programming',
    'Web Development',
    'Mobile Development',
    'UI/UX Design',
    'Graphic Design',
    'Data Science',
    'Machine Learning / AI',
    'Cybersecurity',
    'Cloud Computing',
    'Database Administration',
    'Video Editing',
    'Photography',
    'Digital Marketing',
    'Content Writing',
    'Social Media Management',
    'SEO / SEM',
    'Business & Entrepreneurship',
    'Accounting & Finance',
    'Project Management',
    'Public Speaking',
  ],
}

export default function BecomeHybridPage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  const [category, setCategory] = useState('')
  const [field, setField] = useState('')
  const [otherField, setOtherField] = useState('')
  const [bio, setBio] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fieldOptions = useMemo(() => {
    if (!category || category === 'other') return []
    return specializationCategories[category] || []
  }, [category])

  const finalField = category === 'other' ? otherField.trim() : field

  const handleCategoryChange = (e) => {
    const nextCategory = e.target.value
    setCategory(nextCategory)
    setField('')
    setOtherField('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!category) {
      toast.error('Please choose specialization category')
      return
    }

    if (!finalField) {
      toast.error('Please choose or write specialization field')
      return
    }

    try {
      setIsSubmitting(true)

      await api.patch('/my-profile/account/become-hybrid', {
        specialization: {
          category,
          field: finalField,
        },
        bio: bio.trim(),
      })

      toast.success('Successfully became a hybrid')

      if (typeof refreshUser === 'function') {
        await refreshUser()
      }

      navigate('/my-profile/account')
    } catch (error) {
      console.error('BECOME HYBRID ERROR:', error)
      toast.error(error.response?.data?.message || 'Failed to become hybrid')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[44%_56%]">
        <section className="relative flex min-h-screen flex-col bg-white px-8 py-8 sm:px-14 lg:px-20">
          <Link to="/home" className="inline-flex w-fit items-center gap-3">
            <img
              src="/JaktViggen.svg"
              alt="JaktViggen"
              className="h-16 w-16 object-contain"
            />
            <span className="text-[26px] font-semibold text-black">
              JaktViggen
            </span>
          </Link>

          <div className="flex flex-1 items-center justify-center">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-[420px] text-center"
            >
              <h1 className="text-[26px] font-bold text-[#4057c8]">
                Become a Hybrid
              </h1>

              <p className="mt-2 text-[15px] font-medium text-[#2440c8]">
                Add specialization and bio to start teaching
              </p>

              <div className="mt-10">
                <div className="relative">
                  <select
                    value={category}
                    onChange={handleCategoryChange}
                    className="h-[70px] w-full appearance-none rounded-full bg-[#f4e8e8] px-12 pr-14 text-[16px] text-slate-600 outline-none"
                  >
                    <option value="">Specialization Category</option>
                    <option value="academic">Academic</option>
                    <option value="skill">Skill</option>
                    <option value="other">Other</option>
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-8 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              {category && category !== 'other' ? (
                <div className="mt-5">
                  <div className="relative">
                    <select
                      value={field}
                      onChange={(e) => setField(e.target.value)}
                      className="h-[70px] w-full appearance-none rounded-full bg-[#f4e8e8] px-12 pr-14 text-[16px] text-slate-600 outline-none"
                    >
                      <option value="">Specialization Field</option>
                      {fieldOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-8 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>
              ) : null}

              {category === 'other' ? (
                <div className="mt-5">
                  <input
                    value={otherField}
                    onChange={(e) => setOtherField(e.target.value)}
                    placeholder="Write your specialization"
                    className="h-[70px] w-full rounded-full bg-[#f4e8e8] px-12 text-[16px] text-slate-700 outline-none placeholder:text-slate-500"
                  />
                </div>
              ) : null}

              <div className="my-14 h-px w-full bg-black/25" />

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bio (Tell something about yourself)"
                className="min-h-[230px] w-full resize-none rounded-[36px] bg-[#f4e8e8] px-8 py-7 text-[16px] text-slate-700 outline-none placeholder:text-slate-500"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-14 h-[76px] w-[270px] rounded-full bg-[#7198e8] text-[22px] font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/my-profile/account')}
                className="mt-4 block w-full text-center text-[11px] text-[#7658d9]"
              >
                I want to stay as a student
              </button>
            </form>
          </div>
        </section>

        <section className="hidden min-h-screen bg-[#1d1291] lg:block">
          <div
            className="h-full w-full bg-cover bg-center opacity-55"
            style={{
              backgroundImage: "url('/auth-bg.png')",
            }}
          />
        </section>
      </div>
    </div>
  )
}
