const mongoose = require("mongoose");

const connectDB = async () => {
  console.log("connectDB() called");
  try {
    console.log("connecting...");
    console.log(`String: ${process.env.MONGO_URI}`);
    await mongoose.connect(process.env.MONGO_URI),
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
      }; // No need for additional options
    console.log("MongoDB Connected...");
  } catch (err) {
    console.log("Failed connecting...");
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
