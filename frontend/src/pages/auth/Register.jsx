import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import AuthLayout from '../../layouts/AuthLayout'
import toast from 'react-hot-toast'

const inputClass =
  'h-12 w-full rounded-full bg-[#EADDDD] px-5 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:bg-[#f1e6e6] focus:ring-2 focus:ring-blue-300 sm:h-[52px] sm:text-base'

const selectClass =
  'h-12 w-full rounded-full bg-[#EADDDD] px-5 text-sm text-gray-600 outline-none transition focus:bg-[#f1e6e6] focus:ring-2 focus:ring-blue-300 sm:h-[52px] sm:text-base'

const buttonClass =
  'h-12 w-full rounded-full bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:h-[52px] sm:text-base'

export default function Register() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    phoneCountryCode: '+62',
    phoneNumber: '',
  })

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleRegister = async (e) => {
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

    if (!form.phoneNumber.trim()) {
      toast.error('Phone number is required')
      return
    }

    try {
      setIsSubmitting(true)

      await api.post('/auth/register', {
        ...form,
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
      })

      toast.success('Register berhasil')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Register gagal')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Register">
      <div className="flex w-full justify-center px-4 sm:px-6 lg:px-8">
        <form
          onSubmit={handleRegister}
          className="flex w-full max-w-[460px] flex-col gap-5 sm:gap-6"
        >
          <div className="grid grid-cols-1 gap-4 sm:gap-5">
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
              className={inputClass}
              value={form.email}
              onChange={handleChange}
            />

            <input
              name="password"
              type="password"
              placeholder="Password"
              className={inputClass}
              value={form.password}
              onChange={handleChange}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
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
          </div>

          <button type="submit" disabled={isSubmitting} className={buttonClass}>
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>

          <div className="flex flex-col items-center gap-2 text-center text-sm leading-6 sm:gap-3">
            <Link
              to="/register-hybrid"
              className="font-medium text-blue-500 transition hover:text-blue-600"
            >
              Register as Teacher
            </Link>

            <Link
              to="/login"
              className="font-medium text-blue-500 transition hover:text-blue-600"
            >
              I already have an account
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  )
}
