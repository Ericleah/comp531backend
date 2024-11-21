require("dotenv").config({ path: "./.env" });
process.env.NODE_ENV = "test";

module.exports = async () => {
  // Any other global setup needed for tests
};