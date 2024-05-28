'use client'

import { useState } from 'react'
import axios from 'axios'
import { Button } from '@/components/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          email,
          password,
        },
      )

      console.log('logged in', response.data)
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
