const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: [true, "Username is required"],
  },
  salt: { type: String },
  email: { type: String },
  dob: { type: Date },
  phone: { type: String },
  zipcode: { type: String },
  password: { type: String },
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  created: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
