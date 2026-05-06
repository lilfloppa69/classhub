import { useEffect, useState } from 'react'
import { Eye, EyeOff, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'
import MyProfileLayout from '../layouts/MyProfileLayout'

export default function MyProfileAccountPage() {
  const navigate = useNavigate()

  const [account, setAccount] = useState({
    email: '',
    phoneCountryCode: '+62',
    phoneNumber: '',
    role: '',
  })
  const [form, setForm] = useState({
    email: '',
    password: '',
    phoneCountryCode: '+62',
    phoneNumber: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fetchAccount = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/my-profile/account')
      const data = res.data?.data || {}

      setAccount({
        email: data.email || '',
        phoneCountryCode: data.phoneCountryCode || '+62',
        phoneNumber: data.phoneNumber || '',
        role: data.role || 'student',
      })

      setForm({
        email: data.email || '',
        password: '',
        phoneCountryCode: data.phoneCountryCode || '+62',
        phoneNumber: data.phoneNumber || '',
      })
    } catch (error) {
      console.error('Failed to fetch account:', error)
      toast.error(error.response?.data?.message || 'Failed to load account')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAccount()
  }, [])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))
  }

  const handleCancel = () => {
    setForm({
      email: account.email || '',
      password: '',
      phoneCountryCode: account.phoneCountryCode || '+62',
      phoneNumber: account.phoneNumber || '',
    })
    setIsEditing(false)
    setShowPassword(false)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const payload = {
        email: form.email,
        phoneCountryCode: form.phoneCountryCode,
        phoneNumber: form.phoneNumber,
      }

      if (form.password.trim()) {
        payload.password = form.password
      }

      await api.patch('/my-profile/account', payload)

      toast.success('Account updated')
      setIsEditing(false)
      setShowPassword(false)
      await fetchAccount()
    } catch (error) {
      console.error('Failed to update account:', error)
      toast.error(error.response?.data?.message || 'Failed to update account')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <MyProfileLayout>
      {isLoading ? (
        <div className="space-y-8">
          <div className="h-14 w-[48%] rounded-[14px] bg-slate-100" />
          <div className="h-14 w-[48%] rounded-[14px] bg-slate-100" />
          <div className="h-14 w-[48%] rounded-[14px] bg-slate-100" />
          <div className="h-14 w-[48%] rounded-[14px] bg-slate-100" />
        </div>
      ) : (
        <div className="relative min-h-[650px]">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,620px)_1fr]">
            <div className="space-y-7">
              <div>
                <label className="mb-3 block text-[16px] font-medium text-[#333]">
                  Email
                </label>
                <input
                  value={form.email}
                  onChange={handleChange('email')}
                  disabled={!isEditing}
                  className="h-[52px] w-full rounded-[8px] bg-[#f4f4f4] px-5 text-[16px] text-slate-600 outline-none placeholder:text-slate-400 disabled:text-slate-400"
                  placeholder="Email"
                />
              </div>

              <div>
                <label className="mb-3 block text-[16px] font-medium text-[#333]">
                  Password
                </label>
                <div className="relative">
                  <input
                    value={form.password}
                    onChange={handleChange('password')}
                    disabled={!isEditing}
                    type={showPassword ? 'text' : 'password'}
                    className="h-[52px] w-full rounded-[8px] bg-[#f4f4f4] px-5 pr-14 text-[16px] text-slate-600 outline-none placeholder:text-slate-400 disabled:text-slate-400"
                    placeholder="********"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={!isEditing}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-black transition disabled:opacity-40"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-[16px] font-medium text-[#333]">
                  Phone Number
                </label>

                <div className="relative flex h-[52px] w-full items-center rounded-[8px] bg-[#f4f4f4] px-4">
                  <select
                    value={form.phoneCountryCode}
                    onChange={handleChange('phoneCountryCode')}
                    disabled={!isEditing}
                    className="mr-3 h-full appearance-none bg-transparent pr-6 text-[16px] text-slate-500 outline-none disabled:text-slate-400"
                  >
                    <option value="+62">+62</option>
                    <option value="+60">+60</option>
                    <option value="+66">+66</option>
                    <option value="+86">+86</option>
                    <option value="+81">+81</option>
                  </select>

                  <input
                    value={form.phoneNumber}
                    onChange={handleChange('phoneNumber')}
                    disabled={!isEditing}
                    className="min-w-0 flex-1 bg-transparent text-[16px] text-slate-600 outline-none placeholder:text-slate-400 disabled:text-slate-400"
                    placeholder="Phone number"
                  />

                  <ChevronDown className="ml-3 h-5 w-5 shrink-0 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-[16px] font-medium text-[#333]">
                  Role
                </label>
                <input
                  value={account.role === 'teacher' ? 'teacher' : 'student'}
                  disabled
                  className="h-[52px] w-full rounded-[8px] bg-[#f4f4f4] px-5 text-[16px] capitalize text-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col items-end pt-[59px]">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="h-11 rounded-[8px] bg-[#3f73f4] px-9 text-[15px] font-medium text-white transition hover:brightness-105"
                >
                  Edit
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="h-11 rounded-[8px] bg-slate-100 px-7 text-[15px] font-medium text-slate-700 transition hover:bg-slate-200"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-11 rounded-[8px] bg-[#3f73f4] px-8 text-[15px] font-medium text-white transition hover:brightness-105 disabled:opacity-60"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MyProfileLayout>
  )
}
