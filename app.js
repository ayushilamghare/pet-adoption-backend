const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const app = express();

const errorMiddleware = require("./middleware/errorMiddleware");

// middleware
app.use(cors());

// Detailed logging format
morgan.token("body", (req) => JSON.stringify(req.body));
app.use(morgan(":method :url :status :res[content-length] - :response-time ms | Body: :body"));

app.use(express.json());

// routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/pets", require("./routes/petRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/foster", require("./routes/fosterRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// error handler (ALWAYS LAST)
app.use(errorMiddleware);

module.exports = app;
