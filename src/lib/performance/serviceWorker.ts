/**
 * Service Worker Registration & Management
 * Enables offline support and background sync
 */

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('✅ Service Worker registered:', registration.scope)

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 New Service Worker available')
            // Notify user of update
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('Failed to register Service Worker:', error)
    return null
  }
}

/**
 * Unregister Service Worker (for cleanup)
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      await registration.unregister()
    }
    console.log('Service Worker unregistered')
  } catch (error) {
    console.error('Failed to unregister:', error)
  }
}

/**
 * Check if app is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine
}

/**
 * Listen for online/offline events
 */
export function onOnlineStatusChange(callback: (online: boolean) => void) {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Cleanup function
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
