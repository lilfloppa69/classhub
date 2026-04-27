import { Toaster } from 'react-hot-toast'

export default function AppToast() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 2500,
        style: {
          background: '#1E1B8F',
          color: '#fff',
          borderRadius: '999px',
          padding: '14px 20px',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        },
        success: {
          iconTheme: {
            primary: '#3B82F6',
            secondary: '#fff',
          },
        },
        error: {
          style: {
            background: '#dc2626',
            color: '#fff',
            borderRadius: '999px',
            padding: '14px 20px',
            fontSize: '14px',
            fontWeight: '600',
          },
        },
      }}
    />
  )
}
