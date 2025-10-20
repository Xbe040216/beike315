export class WebSocketService {
  constructor(url) {
    this.url = url
    this.socket = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.listeners = {
      message: [],
      open: [],
      close: [],
      error: [],
    }
  }

  connect() {
    this.socket = new WebSocket(this.uri)
    this.socket.onopen = (e) => {
      this.reconnectAttempts = 0
      this.listeners.open.forEach((callback) => callback(e))
    }

    this.socket.onmessage = (e) => {
      this.listeners.message.forEach((callback) => callback(e.data))
    }

    this.socket.onclose = (e) => {
      this.listeners.close.forEach((callback) => callback(e))
      if (!e.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        setTimeout(() => this.connect(), this.reconnectDelay)
      }
    }

    this.socket.onerror = (e) => {
      this.listeners.error.forEach((callback) => callback(e))
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(typeof data === 'object' ? JSON.stringify(data) : data)
    }
  }

  close() {
    if (this.socket) {
      this.socket.close()
    }
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback)
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
    }
  }
}
