import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import AuthLayout from '../../layouts/AuthLayout'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
  })

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    try {
      await api.post('/auth/register', form)
      toast.success('Register berhasil')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Register gagal')
    }
  }

  return (
    <AuthLayout title="Register">
      <form onSubmit={handleRegister} className="flex flex-col gap-8">
        <input
          name="username"
          placeholder="Username"
          className="bg-[#EADDDD] rounded-full px-5 py-3 outline-none"
          value={form.username}
          onChange={handleChange}
        />

        <input
          name="fullName"
          placeholder="Full Name"
          className="bg-[#EADDDD] rounded-full px-5 py-3 outline-none"
          value={form.fullName}
          onChange={handleChange}
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="bg-[#EADDDD] rounded-full px-5 py-3 outline-none"
          value={form.email}
          onChange={handleChange}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          className="bg-[#EADDDD] rounded-full px-5 py-3 outline-none"
          value={form.password}
          onChange={handleChange}
        />

        <input
          name="phoneNumber"
          placeholder="Phone Number"
          className="bg-[#EADDDD] rounded-full px-5 py-3 outline-none"
          value={form.phoneNumber}
          onChange={handleChange}
        />

        <button className="bg-blue-500 text-white rounded-full py-3 font-semibold hover:bg-blue-600 transition">
          Register
        </button>

        <Link
          to="/register-hybrid"
          className="text-center text-sm text-blue-500 cursor-pointer"
        >
          I also wanna assign as a teacher
        </Link>
        <Link
          to="/login"
          className="text-center text-sm text-blue-500 cursor-pointer"
        >
          I already have an account
        </Link>
      </form>
    </AuthLayout>
  )
}
