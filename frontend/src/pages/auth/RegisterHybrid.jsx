import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'
import AuthLayout from '../../layouts/AuthLayout'

const inputClass =
  'h-12 w-full rounded-full bg-[#EADDDD] px-5 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:bg-[#f1e6e6] focus:ring-2 focus:ring-blue-300 sm:h-[52px] sm:text-base'

const selectClass =
  'h-12 w-full rounded-full bg-[#EADDDD] px-5 text-sm text-gray-600 outline-none transition focus:bg-[#f1e6e6] focus:ring-2 focus:ring-blue-300 sm:h-[52px] sm:text-base'

const textareaClass =
  'min-h-24 w-full resize-none rounded-3xl bg-[#EADDDD] px-5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:bg-[#f1e6e6] focus:ring-2 focus:ring-blue-300 sm:min-h-28 sm:text-base'

const buttonClass =
  'h-12 w-full rounded-full bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:h-[52px] sm:text-base'

export default function RegisterHybrid() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    phoneCountryCode: '+62',
    phoneNumber: '',
    gender: '',
    specialization: {
      category: '',
      field: '',
    },
    bio: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'category' || name === 'field') {
      setForm((prev) => ({
        ...prev,
        specialization: {
          ...prev.specialization,
          [name]: value,
        },
      }))
      return
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRegisterHybrid = async (e) => {
    e.preventDefault()

    if (!form.username.trim()) {
      toast.error('Username is required')
      return
    }

    if (!form.fullName.trim()) {
      toast.error('Full name is required')
      return
    }

    if (!form.email.trim()) {
      toast.error('Email is required')
      return
    }

    if (!form.password.trim()) {
      toast.error('Password is required')
      return
    }

    if (!form.gender) {
      toast.error('Gender is required')
      return
    }

    if (!form.specialization.category) {
      toast.error('Specialization category is required')
      return
    }

    if (!form.specialization.field.trim()) {
      toast.error('Specialization is required')
      return
    }

    if (!form.phoneNumber.trim()) {
      toast.error('Phone number is required')
      return
    }

    if (!form.bio.trim()) {
      toast.error('Bio is required')
      return
    }

    try {
      setIsSubmitting(true)

      await api.post('/auth/register-hybrid', {
        ...form,
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        specialization: {
          category: form.specialization.category,
          field: form.specialization.field.trim(),
        },
        bio: form.bio.trim(),
      })

      toast.success('Teacher account created')
      navigate('/login')
    } catch (err) {
      console.error(
        'REGISTER TEACHER ERROR:',
        err.response?.data || err.message,
      )
      toast.error(err.response?.data?.message || 'Register failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Register as Teacher">
      <div className="flex w-full justify-center px-4 sm:px-6 lg:px-8">
        <form
          onSubmit={handleRegisterHybrid}
          className="flex w-full max-w-[520px] flex-col gap-5 sm:gap-6"
        >
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
            <input
              name="username"
              placeholder="Username"
              className={inputClass}
              value={form.username}
              onChange={handleChange}
            />

            <input
              name="fullName"
              placeholder="Full Name"
              className={inputClass}
              value={form.fullName}
              onChange={handleChange}
            />

            <input
              name="email"
              type="email"
              placeholder="Email"
              className={`${inputClass} md:col-span-2`}
              value={form.email}
              onChange={handleChange}
            />

            <input
              name="password"
              type="password"
              placeholder="Password"
              className={`${inputClass} md:col-span-2`}
              value={form.password}
              onChange={handleChange}
            />

            <select
              name="gender"
              className={selectClass}
              value={form.gender}
              onChange={handleChange}
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            <select
              name="category"
              className={selectClass}
              value={form.specialization.category}
              onChange={handleChange}
            >
              <option value="">Specialization Category</option>
              <option value="academic">Academic</option>
              <option value="skill">Skill</option>
              <option value="other">Other</option>
            </select>

            <input
              name="field"
              placeholder="Specialization"
              className={`${inputClass} md:col-span-2`}
              value={form.specialization.field}
              onChange={handleChange}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_minmax(0,1fr)] md:col-span-2">
              <select
                name="phoneCountryCode"
                className={selectClass}
                value={form.phoneCountryCode}
                onChange={handleChange}
              >
                <option value="+62">+62</option>
                <option value="+60">+60</option>
                <option value="+66">+66</option>
                <option value="+86">+86</option>
                <option value="+81">+81</option>
              </select>

              <input
                name="phoneNumber"
                placeholder="Phone Number"
                className={inputClass}
                value={form.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <textarea
              name="bio"
              placeholder="Bio (Tell students about yourself)"
              className={`${textareaClass} md:col-span-2`}
              value={form.bio}
              onChange={handleChange}
            />
          </div>

          <button type="submit" disabled={isSubmitting} className={buttonClass}>
            {isSubmitting ? 'Registering...' : 'Register as Teacher'}
          </button>

          <p className="text-center text-sm leading-6 text-gray-500">
            Want to join classes as a student?{' '}
            <Link
              to="/register"
              className="font-medium text-blue-500 transition hover:text-blue-600"
            >
              Register as student
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}
