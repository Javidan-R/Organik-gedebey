// components/NotificationListener.tsx
'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { subscribeToNotifications } from '@/lib/pusher/client'
import toast from 'react-hot-toast'

export function NotificationListener() {
  const { data: session } = useSession()
  
  useEffect(() => {
    if (!session?.user?.id) return
    
    const unsubscribe = subscribeToNotifications(
      session.user.id,
      (notification) => {
        toast.success(notification.title, {
          duration: 3000,
          position: 'top-right',


        })
      }
    ) 
    
    return unsubscribe
  }, [session?.user?.id])
  
  return null
}