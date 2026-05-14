require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

connectDB();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'https://fruteria-shop.onrender.com',
  'http://localhost:5173',
  /\.vercel\.app$/ // Matches any Vercel subdomain
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.set("socketio", io);

io.on("connection", (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));

app.get("/", (req, res) => {
  res.send("Fruteria API Running");
});

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});