import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api", "")
  : window.location.origin;

const socket = io(socketUrl, {
  transports: ["websocket"],
  autoConnect: true
});

export default socket;
