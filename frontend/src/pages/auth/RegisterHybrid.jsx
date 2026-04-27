import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'
import AuthLayout from '../../layouts/AuthLayout'

export default function RegisterHybrid() {
  const navigate = useNavigate()

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

    try {
      await api.post('/auth/register-hybrid', form)
      toast.success('Hybrid account created')
    } catch (err) {
      console.error('REGISTER HYBRID ERROR:', err.response?.data || err.message)
      toast.error(err.response?.data?.message || 'Register failed')
    }
  }

  return (
    <AuthLayout title="Register">
      <form onSubmit={handleRegisterHybrid} className="flex flex-col gap-4">
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

        <select
          name="gender"
          className="bg-[#EADDDD] rounded-full px-5 py-3 outline-none text-gray-600"
          value={form.gender}
          onChange={handleChange}
        >
          <option value="">Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <select
          name="category"
          className="bg-[#EADDDD] rounded-full px-5 py-3 outline-none text-gray-600"
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
          className="bg-[#EADDDD] rounded-full px-5 py-3 outline-none"
          value={form.specialization.field}
          onChange={handleChange}
        />

        <div className="flex gap-2">
          <select
            name="phoneCountryCode"
            className="bg-[#EADDDD] rounded-full px-4 py-3 outline-none text-gray-600 w-28"
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
            className="bg-[#EADDDD] rounded-full px-5 py-3 outline-none flex-1"
            value={form.phoneNumber}
            onChange={handleChange}
          />
        </div>

        <textarea
          name="bio"
          placeholder="Bio"
          className="bg-[#EADDDD] rounded-3xl px-5 py-3 outline-none min-h-24 resize-none"
          value={form.bio}
          onChange={handleChange}
        />

        <button className="bg-blue-500 text-white rounded-full py-3 font-semibold hover:bg-blue-600 transition">
          Register
        </button>

        <p className="text-center text-sm text-gray-500">
          I only want to assign as a student?{' '}
          <Link to="/register" className="text-blue-500">
            Register as student
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
