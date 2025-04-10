const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

const PORT = 8000;

app.listen(8000, '0.0.0.0', () => {
  console.log("Server running on http://0.0.0.0:8000");
});
