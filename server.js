const app = require("./app");
const connectDB = require("./config/db");
const dotenv = require("dotenv");

// load env variables
dotenv.config();

// handle uncaught exceptions (sync errors)
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

// handle unhandled promise rejections (async errors)
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  if (!server) {
    process.exit(1);
  }

  server.close(() => {
    process.exit(1);
  });
});

startServer();
