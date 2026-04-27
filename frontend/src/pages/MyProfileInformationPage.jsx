import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  Mail,
  Camera,
  Trash2,
  Upload,
  X,
  BadgeCheck,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import MyProfileLayout from '../layouts/MyProfileLayout'
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '../utils/cropImage'

const displayNameOptions = [
  { label: 'Full Name', value: 'fullName' },
  { label: 'Nickname', value: 'nickname' },
  { label: 'Username', value: 'username' },
]

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
]

const countryOptions = [
  { label: 'Indonesia', value: 'indonesia' },
  { label: 'Malaysia', value: 'malaysia' },
  { label: 'Singapore', value: 'singapore' },
  { label: 'Thailand', value: 'thailand' },
  { label: 'Japan', value: 'japan' },
  { label: 'China', value: 'china' },
]

const timezoneOptions = [
  { label: 'Tokyo', value: 'tokyo' },
  { label: 'Beijing', value: 'beijing' },
  { label: 'Jakarta', value: 'jakarta' },
  { label: 'Bangkok', value: 'bangkok' },
]

const languageOptions = [
  { label: 'English', value: 'english' },
  { label: 'Indonesian', value: 'indonesian' },
  { label: 'Malay', value: 'malay' },
]

function buildAvatarUrl(avatar) {
  if (!avatar) return ''

  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }

  const apiBase =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:3000/api'

  const originOnly = apiBase.replace(/\/+$/, '').replace(/\/api$/, '')
  const normalizedAvatar = avatar.startsWith('/') ? avatar : `/${avatar}`

  return `${originOnly}${normalizedAvatar}`
}

function formatText(value) {
  if (!value) return '-'

  return String(value)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  readOnly = false,
}) {
  return (
    <div>
      <label className="mb-3 block text-[15px] font-medium text-slate-800">
        {label}
      </label>

      <input
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={`h-[54px] w-full rounded-[16px] px-5 text-[15px] outline-none transition placeholder:text-slate-400 ${
          disabled || readOnly
            ? 'bg-[#f3f3f3] text-slate-500'
            : 'border border-[#dfe4ee] bg-white text-slate-700 focus:border-[#4e83f1]'
        }`}
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options, disabled }) {
  return (
    <div>
      <label className="mb-3 block text-[15px] font-medium text-slate-800">
        {label}
      </label>

      <div className="relative">
        <select
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          className={`h-[54px] w-full appearance-none rounded-[16px] px-5 pr-12 text-[15px] outline-none transition ${
            disabled
              ? 'bg-[#f3f3f3] text-slate-500'
              : 'border border-[#dfe4ee] bg-white text-slate-700 focus:border-[#4e83f1]'
          }`}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  )
}

function TextAreaField({ label, value, onChange, placeholder, disabled }) {
  return (
    <div>
      <label className="mb-3 block text-[15px] font-medium text-slate-800">
        {label}
      </label>

      <textarea
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`min-h-[140px] w-full resize-none rounded-[18px] px-5 py-4 text-[15px] outline-none transition placeholder:text-slate-400 ${
          disabled
            ? 'bg-[#f3f3f3] text-slate-500'
            : 'border border-[#dfe4ee] bg-white text-slate-700 focus:border-[#4e83f1]'
        }`}
      />
    </div>
  )
}

export default function MyProfileInformationPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    fullName: '',
    nickname: '',
    username: '',
    country: '',
    displayNamePreference: '',
    timezone: '',
    gender: '',
    language: '',
    email: '',
    avatar: '',
    role: 'student',
    specialization: {
      category: '',
      field: '',
    },
    bio: '',
  })

  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false)
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false)
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const avatarInputRef = useRef(null)
  const avatarMenuRef = useRef(null)

  const avatarUrl = useMemo(() => buildAvatarUrl(form.avatar), [form.avatar])
  const isHybrid = form.role === 'hybrid'

  const syncForm = (data) => {
    setForm({
      fullName: data?.fullName || '',
      nickname: data?.nickname || '',
      username: data?.username || '',
      country: data?.country || '',
      displayNamePreference: data?.displayNamePreference || 'fullName',
      timezone: data?.timezone || 'jakarta',
      gender: data?.gender || '',
      language: data?.language || 'english',
      email: data?.email || '',
      avatar: data?.avatar || '',
      role: data?.role || 'student',
      specialization: {
        category: data?.specialization?.category || '',
        field: data?.specialization?.field || '',
      },
      bio: data?.bio || '',
    })
  }

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/my-profile/information')
      const data = res.data?.data || null

      setProfile(data)
      syncForm(data)
    } catch (error) {
      console.error('Failed to fetch profile information:', error)
      toast.error(error.response?.data?.message || 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setAvatarLoadFailed(false)
  }, [form.avatar])

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        avatarMenuRef.current &&
        !avatarMenuRef.current.contains(event.target)
      ) {
        setIsAvatarMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))
  }

  const handleOpenAvatarEditor = () => {
    setAvatarPreview(avatarUrl || '')
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setIsAvatarMenuOpen(false)
    setIsAvatarEditorOpen(true)
  }

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)

    setAvatarPreview(objectUrl)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels)
  }

  const handleUploadAvatar = async () => {
    if (!avatarPreview || !croppedAreaPixels) {
      toast.error('Please choose and crop an image first')
      return
    }

    try {
      setIsUploadingAvatar(true)

      const { file } = await getCroppedImg(avatarPreview, croppedAreaPixels)

      const formData = new FormData()
      formData.append('avatar', file)

      const res = await api.post('/my-profile/information/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const nextAvatar = res.data?.data?.avatar || ''

      setForm((prev) => ({
        ...prev,
        avatar: nextAvatar,
      }))

      toast.success('Avatar updated')
      setIsAvatarEditorOpen(false)
      await fetchProfile()
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      toast.error(error.response?.data?.message || 'Failed to upload avatar')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleDeleteAvatar = async () => {
    try {
      setIsDeletingAvatar(true)

      await api.delete('/my-profile/information/avatar')

      setForm((prev) => ({
        ...prev,
        avatar: '',
      }))

      toast.success('Avatar removed')
      setIsAvatarMenuOpen(false)
      setIsAvatarEditorOpen(false)
      await fetchProfile()
    } catch (error) {
      console.error('Failed to delete avatar:', error)
      toast.error(error.response?.data?.message || 'Failed to delete avatar')
    } finally {
      setIsDeletingAvatar(false)
    }
  }

  const handleCancel = () => {
    if (!profile) return
    syncForm(profile)
    setIsEditing(false)
  }

  const handleSave = async () => {
    try {
      await api.patch('/my-profile/information', {
        fullName: form.fullName,
        nickname: form.nickname,
        country: form.country,
        displayNamePreference: form.displayNamePreference,
        timezone: form.timezone,
        gender: form.gender,
        language: form.language,
        bio: isHybrid ? form.bio : undefined,
      })

      toast.success('Profile updated')
      setIsEditing(false)
      await fetchProfile()
    } catch (error) {
      console.error('Failed to update profile information:', error)
      toast.error(error.response?.data?.message || 'Failed to save profile')
    }
  }

  return (
    <MyProfileLayout>
      {isLoading ? (
        <div className="space-y-8">
          <div className="flex items-center gap-5">
            <div className="h-24 w-24 rounded-full bg-slate-200" />
            <div className="space-y-3">
              <div className="h-8 w-52 rounded-xl bg-slate-200" />
              <div className="h-5 w-72 rounded-xl bg-slate-100" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-[78px] rounded-[18px] bg-slate-100"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative" ref={avatarMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAvatarMenuOpen((prev) => !prev)}
                  className="group relative block h-24 w-24 overflow-hidden rounded-full ring-4 ring-white shadow-sm"
                >
                  {avatarUrl && !avatarLoadFailed ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      onError={() => setAvatarLoadFailed(true)}
                      className="h-24 w-24 rounded-full object-cover transition group-hover:brightness-75"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-2xl font-semibold text-slate-600 transition group-hover:bg-slate-300">
                      {(form.fullName || form.username || 'U')
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/0 opacity-0 transition group-hover:bg-black/15 group-hover:opacity-100">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </button>

                {isAvatarMenuOpen && (
                  <div className="absolute left-1/2 top-[110%] z-20 w-44 -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                    <button
                      type="button"
                      onClick={handleOpenAvatarEditor}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <Upload className="h-4 w-4" />
                      Upload avatar
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      disabled={isDeletingAvatar}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-500 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete avatar
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[34px] font-semibold tracking-[-0.02em] text-slate-900">
                    {form.fullName || 'Unnamed User'}
                  </h1>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      isHybrid
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isHybrid ? (
                      <BadgeCheck className="h-3.5 w-3.5" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {form.role}
                  </span>
                </div>

                <p className="mt-2 text-[18px] text-slate-500">{form.email}</p>

                {isHybrid ? (
                  <p className="mt-2 text-sm font-medium text-violet-600">
                    {formatText(form.specialization.category)} •{' '}
                    {form.specialization.field || '-'}
                  </p>
                ) : null}
              </div>
            </div>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="h-11 rounded-[12px] bg-[#4e83f1] px-7 text-sm font-medium text-white transition hover:brightness-105"
              >
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="h-11 rounded-[12px] bg-slate-100 px-6 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="h-11 rounded-[12px] bg-[#4e83f1] px-7 text-sm font-medium text-white transition hover:brightness-105"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="mt-10 rounded-[26px] border border-slate-100 bg-white/70 p-6 shadow-sm">
            <h2 className="mb-6 text-[22px] font-semibold text-slate-900">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2">
              <InputField
                label="Full Name"
                value={form.fullName}
                onChange={handleChange('fullName')}
                placeholder="Full name"
                disabled={!isEditing}
              />

              <InputField
                label="Nick Name"
                value={form.nickname}
                onChange={handleChange('nickname')}
                placeholder="Nickname"
                disabled={!isEditing}
              />

              <InputField
                label="Username"
                value={form.username}
                onChange={handleChange('username')}
                placeholder="Username"
                disabled
                readOnly
              />

              <SelectField
                label="Display Name Preference"
                value={form.displayNamePreference}
                onChange={handleChange('displayNamePreference')}
                options={displayNameOptions}
                disabled={!isEditing}
              />

              <SelectField
                label="Gender"
                value={form.gender}
                onChange={handleChange('gender')}
                options={genderOptions}
                disabled={!isEditing}
              />

              <SelectField
                label="Country"
                value={form.country}
                onChange={handleChange('country')}
                options={countryOptions}
                disabled={!isEditing}
              />

              <SelectField
                label="Time Zone"
                value={form.timezone}
                onChange={handleChange('timezone')}
                options={timezoneOptions}
                disabled={!isEditing}
              />

              <SelectField
                label="Language"
                value={form.language}
                onChange={handleChange('language')}
                options={languageOptions}
                disabled={!isEditing}
              />
            </div>
          </div>

          {isHybrid ? (
            <div className="mt-8 rounded-[26px] border border-violet-100 bg-violet-50/50 p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <BadgeCheck className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-[22px] font-semibold text-slate-900">
                    Hybrid Profile
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Your teacher-facing profile information.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2">
                <InputField
                  label="Specialization Category"
                  value={formatText(form.specialization.category)}
                  disabled
                  readOnly
                />

                <InputField
                  label="Specialization Field"
                  value={form.specialization.field || '-'}
                  disabled
                  readOnly
                />

                <div className="md:col-span-2">
                  <TextAreaField
                    label="Bio"
                    value={form.bio}
                    onChange={handleChange('bio')}
                    placeholder="Tell students something about yourself"
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-8 rounded-[26px] border border-slate-100 bg-white/70 p-6 shadow-sm">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-slate-900">
              My Email Address
            </h2>

            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dfe8fb] text-[#4e83f1]">
                <Mail className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[16px] font-medium text-slate-900">
                  {form.email}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Connected to your ClassHub account
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {isAvatarEditorOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-[420px] rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-[24px] font-semibold text-slate-900">
                  Edit Avatar
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Upload and crop your profile picture.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAvatarEditorOpen(false)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />

            <div className="relative mb-5 h-[320px] w-full overflow-hidden rounded-[24px] bg-[#111827]">
              {avatarPreview ? (
                <Cropper
                  image={avatarPreview}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={handleCropComplete}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-center text-sm text-slate-300">
                  Choose an image to start cropping
                </div>
              )}
            </div>

            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">Zoom</p>
                <span className="text-xs text-slate-400">
                  {zoom.toFixed(1)}x
                </span>
              </div>

              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[#4e83f1]"
                disabled={!avatarPreview}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="rounded-[14px] bg-slate-100 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                Choose Image
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAvatarEditorOpen(false)}
                  className="rounded-[14px] px-5 py-3 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUploadAvatar}
                  disabled={isUploadingAvatar || !avatarPreview}
                  className="rounded-[14px] bg-[#4e83f1] px-5 py-3 text-sm font-medium text-white transition hover:brightness-105 disabled:opacity-60"
                >
                  {isUploadingAvatar ? 'Uploading...' : 'Save Avatar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MyProfileLayout>
  )
}
