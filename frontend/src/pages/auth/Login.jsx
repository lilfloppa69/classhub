import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import AuthLayout from '../../layouts/AuthLayout'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/auth/login', { email, password })
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
      toast.error(err.response?.data?.message || 'GTFO')
    }
  }

  return (
    <AuthLayout title="Login">
      {/* {FORM} */}
      <form onSubmit={handleLogin} className="flex flex-col gap-6 w-[350px]">
        <input
          type="email"
          placeholder="Email"
          className="bg-[#EADDDD] rounded-full px-5 py-3 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="bg-[#EADDDD] rounded-full px-5 py-3 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-between text-sm text-gray-500">
          <span>Remember Me</span>
          <span>Forgot Password?</span>
        </div>

        <button className="bg-blue-500 text-white rounded-full py-3 font-semibold hover:bg-blue-600 transition">
          Login
        </button>

        <p className="text-center text-sm text-gray-500">
          Haven’t had an account?{' '}
          <Link to="/register" className="text-blue-500 cursor-pointer">
            Register
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
