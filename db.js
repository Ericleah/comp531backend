const mongoose = require("mongoose");

// MongoDB URI from environment variables
const mongoDBUri = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose
  .connect(mongoDBUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Mongoose connection successfully opened to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Event listeners for MongoDB connection states
mongoose.connection.on("error", (error) => {
  console.error("Mongoose connection error:", error);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose connection disconnected");
});

// Handle application termination
process.on("SIGINT", () => {
  mongoose.connection.close(() => {
    console.log("Mongoose connection closed due to application termination");
    process.exit(0);
  });
});
