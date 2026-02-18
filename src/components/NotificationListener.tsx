// components/NotificationListener.tsx
'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { pusherClient, subscribeToNotifications } from '@/lib/pusher/client'
import { toast } from 'sonner' // or your toast library

export function NotificationListener() {
  const { data: session } = useSession()
  
  useEffect(() => {
    if (!session?.user?.id) return
    
    const unsubscribe = subscribeToNotifications(
      session.user.id,
      (notification) => {
        toast.success(notification.title, {
          description: notification.message,
        })
      }
    )
    
    return unsubscribe
  }, [session?.user?.id])
  
  return null
}