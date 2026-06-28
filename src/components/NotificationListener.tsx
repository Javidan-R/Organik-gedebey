// components/NotificationListener.tsx
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-store'
import { subscribeToNotifications } from '@/lib/pusher/client'
import toast from 'react-hot-toast'

export function NotificationListener() {
  const { user } = useAuth()
  
  useEffect(() => {
    if (!user?.id) return
    
    const unsubscribe = subscribeToNotifications(
      user.id,
      (notification) => {
        toast.success(notification.title, {
          duration: 3000,
          position: 'top-right',
        })
      }
    )
    
    return unsubscribe
  }, [user?.id])
  
  return null
}