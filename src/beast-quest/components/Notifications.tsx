// ============================================
// Notification Display Component
// ============================================
// Shows temporary notifications for items, level ups, etc.

import { useEffect, useState } from 'react'
import './Notifications.css'

export interface Notification {
  id: number
  type: 'item' | 'levelup' | 'gold' | 'exp' | 'info' | 'heal'
  message: string
  icon?: string
}

interface NotificationsProps {
  notifications: Notification[]
  onDismiss: (id: number) => void
}

export function Notifications({ notifications, onDismiss }: NotificationsProps) {
  return (
    <div className="notifications-container">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: Notification
  onDismiss: (id: number) => void
}) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Start exit animation after delay
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, 2500)

    // Remove after exit animation
    const removeTimer = setTimeout(() => {
      onDismiss(notification.id)
    }, 3000)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(removeTimer)
    }
  }, [notification.id, onDismiss])

  const getIcon = () => {
    switch (notification.type) {
      case 'item':
        return notification.icon || '📦'
      case 'levelup':
        return '⬆️'
      case 'gold':
        return '💰'
      case 'exp':
        return '✨'
      case 'heal':
        return '💚'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  return (
    <div className={`notification notification-${notification.type} ${isExiting ? 'exiting' : ''}`}>
      <span className="notification-icon">{getIcon()}</span>
      <span className="notification-message">{notification.message}</span>
    </div>
  )
}
