import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"

const WS_URL = "http://localhost:5000"

export function useSocket() {
  const [socket] = useState<Socket>(() =>
    io(WS_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 3000,
    })
  )
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    socket.on("connect", () => setIsConnected(true))
    socket.on("disconnect", () => setIsConnected(false))
    socket.on("connect_error", () => setIsConnected(false))

    return () => {
      socket.disconnect()
    }
  }, [socket])

  return { socket, isConnected }
}
