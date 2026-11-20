'use client'

import { useEffect, useRef } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useSensorStore } from '@/store/sensor-store'
import { useAlertStore } from '@/store/alertStore'
import { useEmergencyStore } from '@/store/emergencyStore'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { useLogStore } from '@/store/logStore'
import { useOrderAdminStore } from '@/store/order-admin-store'

export function SocketProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { socket, isConnected } = useSocket()
  const { updateData, setSocketConnected } = useSensorStore()
  const { addAlert, setUnreadCount, applyAlertReadFromServer, applyAllAlertsReadFromServer, applyAlertDeletedFromServer } = useAlertStore()
  const { activate, resolveActive } = useEmergencyStore()
  const addToast = useToastStore((state) => state.addToast)
  const prependLog = useLogStore((state) => state.prependLog)
  const receiveNewOrder = useOrderAdminStore((state) => state.receiveNewOrder)
  const applyStatusChange = useOrderAdminStore((state) => state.applyStatusChange)
  const userId = useAuthStore((state) => state.user?.id)
  const role = useAuthStore((state) => state.user?.role)

  const isSetupRef = useRef(false)

  // 🔥 SYNCHRONISATION CRITIQUE : met à jour le store quand isConnected change
  useEffect(() => {
    setSocketConnected(isConnected)
  }, [isConnected, setSocketConnected])

  // Rejoint la room de l'utilisateur dès que la connexion et l'identité sont prêtes
  useEffect(() => {
    if (!socket || !isConnected || !userId) return
    socket.emit('register', userId)
  }, [socket, isConnected, userId])

  useEffect(() => {
    if (!socket || isSetupRef.current) return

    socket.on('sensor-update', (data) => {
      updateData({
        temperature: data.temperature,
        humidity: data.humidity,
        airQuality: data.airQuality,
        pressure: data.pressure,
        motion: data.motion,
        soundLevel: data.soundLevel,
        sleepScore: data.sleepScore,
        timestamp: new Date(data.timestamp),
        alert: data.alert,
        light: data.light,
        lamp: data.lamp,
        gas: data.gas,
        servo: data.servo,
        rgb: data.rgb,
        rfid: data.rfid,
        buzzer: data.buzzer,
        lightStatus: data.lightStatus,
        co2: data.co2,
      })
    })

    // Live system events (Live Event Center / Logs / Timeline) — every
    // LogService.record() call on the backend broadcasts here in real time.
    socket.on('new-log', (data) => {
      prependLog({
        id: data.id,
        level: data.level,
        source: data.source,
        message: data.message,
        metadata: data.metadata,
        createdAt: new Date(data.createdAt),
      })
    })

    // Commandes distantes (page Contrôle à distance) — permet de garder plusieurs
    // onglets/sessions synchronisés en temps réel sur l'état voulu.
    socket.on('lamp-command', (data) => updateData({ lamp: data.on }))
    socket.on('door-command', (data) => updateData({ servo: data.servo }))
    socket.on('buzzer-command', (data) => updateData({ buzzer: data.on }))
    socket.on('rgb-command', (data) => updateData({ rgb: data.rgb }))

    socket.on('new-alert', (data) => {
      if (data.alert) {
        addAlert({
          id: data.alert.id,
          type: data.alert.type,
          message: data.alert.message,
          sensor: data.alert.sensor,
          value: data.alert.value,
          timestamp: new Date(data.alert.timestamp),
          read: data.alert.read
        })
      }
      if (data.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount)
      }
    })

    socket.on('alert-read', (data) => {
      if (data.alertId) {
        applyAlertReadFromServer(data.alertId, data.unreadCount)
      } else if (data.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount)
      }
    })

    socket.on('all-alerts-read', (data) => {
      applyAllAlertsReadFromServer(data.unreadCount ?? 0)
    })

    socket.on('alert-deleted', (data) => {
      if (data.alertId) {
        applyAlertDeletedFromServer(data.alertId, data.unreadCount)
      }
    })

    socket.on('emergency:activated', (data) => {
      window.dispatchEvent(new CustomEvent('emergency:activated', { detail: { message: data.message } }))
      activate({
        id: data.id,
        level: data.level,
        status: data.status,
        message: data.message,
        triggeredSensors: data.triggeredSensors || [],
        buzzerActive: !!data.buzzerActive,
        emailSent: !!data.emailSent,
        createdAt: new Date(data.createdAt),
      })
      addToast({
        type: 'error',
        title: 'Emergency Detected',
        message: data.message,
      })
    })

    socket.on('emergency:resolved', () => {
      resolveActive()
      addToast({
        type: 'success',
        title: 'Emergency Resolved',
        message: 'The situation has returned to normal.',
      })
    })

    socket.on('order:created', (data) => {
      if (role !== 'admin' || !data.order) return
      receiveNewOrder(data.order)
      addToast({
        type: 'info',
        title: 'New Order',
        message: `${data.order.firstName} ${data.order.lastName} placed a new order.`,
        playSound: true,
        browserNotify: true,
      })
    })

    socket.on('order:status-changed', (data) => {
      if (role !== 'admin' || !data.order) return
      applyStatusChange(data.order, data.event, data.error)

      if (data.event === 'delivered' && data.userCreated) {
        addToast({
          type: 'success',
          title: 'User Account Created',
          message: `${data.order.firstName} ${data.order.lastName}'s account is ready.`,
          playSound: true,
          browserNotify: true,
        })
      } else if (data.event === 'delivery-failed') {
        addToast({
          type: 'error',
          title: 'Delivery Failed',
          message: data.error || `Could not create an account for ${data.order.firstName} ${data.order.lastName}.`,
        })
      }
    })

    isSetupRef.current = true

    return () => {
      socket.off('sensor-update')
      socket.off('new-log')
      socket.off('lamp-command')
      socket.off('door-command')
      socket.off('buzzer-command')
      socket.off('rgb-command')
      socket.off('new-alert')
      socket.off('alert-read')
      socket.off('all-alerts-read')
      socket.off('alert-deleted')
      socket.off('emergency:activated')
      socket.off('emergency:resolved')
      socket.off('order:created')
      socket.off('order:status-changed')
      isSetupRef.current = false
    }
  }, [socket, updateData, addAlert, setUnreadCount, applyAlertReadFromServer, applyAllAlertsReadFromServer, applyAlertDeletedFromServer, activate, resolveActive, addToast, prependLog, receiveNewOrder, applyStatusChange, role])

  return <>{children}</>
}
