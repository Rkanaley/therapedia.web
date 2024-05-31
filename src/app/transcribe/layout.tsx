'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import * as apiService from '@/services/apiService'

const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = Cookies.get('token')

    if (!token) {
      setIsLoading(false)
      return
    }

    apiService
      .validateToken(token)
      .then((isValid) => {
        if (isValid) {
          setIsAuthenticated(true)
        } else {
          Cookies.remove('token')
        }
      })
      .catch((error) => {
        console.error('Error validating token:', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  if (isLoading) {
    return <Loading />
  }

  if (!isAuthenticated) {
    router.push('/login')
    return <Loading />
  }

  return <>{children}</>
}

export default Layout

const Loading = () => {
  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-sky-500"></div>
    </div>
  )
}
