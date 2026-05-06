import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import AuthLayout from '../../layouts/AuthLayout'
import { useAuth } from '../../context/AuthContext'

const inputClass =
  'h-12 w-full rounded-full bg-[#EADDDD] px-5 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:bg-[#f1e6e6] focus:ring-2 focus:ring-blue-300 sm:h-[52px] sm:text-base'

const buttonClass =
  'h-12 w-full rounded-full bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:h-[52px] sm:text-base'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()
  const { login } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Email is required')
      return
    }

    if (!password.trim()) {
      toast.error('Password is required')
      return
    }

    try {
      setIsSubmitting(true)

      const res = await api.post('/auth/login', {
        email: email.trim(),
        password,
      })

      const token = res.data?.token

      if (!token) {
        toast.error('Token tidak ditemukan')
        return
      }

      await login(token)

      toast.success('Login Successful, Welcome Back')
      navigate('/home')
    } catch (err) {
      console.error('LOGIN ERROR:', err.response?.data || err.message)
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Login">
      <div className="flex w-full justify-center px-4 sm:px-6 lg:px-8">
        <form
          onSubmit={handleLogin}
          className="flex w-full max-w-[420px] flex-col gap-5 sm:gap-6"
        >
          <div className="space-y-4 sm:space-y-5">
            <input
              type="email"
              placeholder="Email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex w-fit cursor-pointer items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-blue-500" />
              <span>Remember Me</span>
            </label>

            <button
              type="button"
              className="w-fit text-left text-blue-500 transition hover:text-blue-600"
            >
              Forgot Password?
            </button>
          </div>

          <button type="submit" disabled={isSubmitting} className={buttonClass}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>

          <p className="text-center text-sm leading-6 text-gray-500">
            Haven’t had an account?{' '}
            <Link
              to="/register"
              className="font-medium text-blue-500 transition hover:text-blue-600"
            >
              Register
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}
