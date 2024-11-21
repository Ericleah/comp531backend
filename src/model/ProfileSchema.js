const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: [true, "User reference is required"],
    unique: true, // Ensures one profile per user
  },
  username: {
    type: String,
    required: true,
    trim: true, // Removes extra spaces
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensures no duplicate emails
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email address",
    ],
  },
  dob: {
    type: Date,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    match: [
      /^\d{10,15}$/,
      "Please provide a valid phone number with 10-15 digits",
    ],
  },
  zipcode: {
    type: String,
    required: true,
    match: [/^\d{5}(-\d{4})?$/, "Please provide a valid ZIP code"],
  },
  password: {
    type: String,
    required: true,
  },
  headline: {
    type: String,
    default: "This is the default headline.",
  },
  avatar: {
    type: String,
    default:
      "https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/DWLeebron.jpg/220px-DWLeebron.jpg",
  },
});

// Exporting the Profile model
module.exports = mongoose.model("Profile", profileSchema);
