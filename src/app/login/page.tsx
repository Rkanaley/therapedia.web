'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import * as apiService from '@/services/apiService'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    try {
      const { token } = await apiService.login(email, password)

      if (!token) {
        console.error('Token not found in response')
        return
      }

      // Set token in cookie with additional options
      Cookies.set('token', token, {
        expires: 7, // Cookie will expire in 7 days
        secure: process.env.NODE_ENV === 'production', // Secure flag for HTTPS in production
        sameSite: 'Lax', // CSRF protection
        path: '/', // Cookie available in the entire site
      })

      router.push('/transcribe')
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <div className="mt-10 flex flex-col items-center justify-center">
      <div className="w-80 rounded p-4">
        <h2 className="mb-4 text-2xl font-bold">Login</h2>
        <input
          type="email"
          placeholder="Email"
          className="mb-3 w-full rounded border border-sky-300 px-3 py-2 focus:border-sky-500 focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="mb-3 w-full rounded border border-sky-300 px-3 py-2 focus:border-sky-500 focus:outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button className="w-full" onClick={handleLogin}>
          Login
        </Button>
      </div>
    </div>
  )
}
