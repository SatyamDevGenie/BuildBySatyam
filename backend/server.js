// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const civicRoutes = require("./routes/civicRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ service: "NEW WORLD Anti-Fraud Backend", status: "RUNNING" });
});

app.use("/api/civic", civicRoutes);

const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => console.log(`Server live on http://localhost:${PORT}`));
    })
    .catch((err) => {
        console.error("Failed to start server:", err);
        process.exit(1);
    });