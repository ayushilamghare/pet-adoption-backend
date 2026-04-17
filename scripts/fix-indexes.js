const mongoose = require("mongoose");
require("dotenv").config();

async function fixIndexes() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/pet-adoption";
  
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully.");

    const collection = mongoose.connection.db.collection("reviews");
    
    console.log("Checking existing indexes...");
    const indexes = await collection.indexes();
    const hasOldIndex = indexes.some(idx => idx.name === "user_1_shelter_1");

    if (hasOldIndex) {
      console.log("Found legacy index 'user_1_shelter_1'. Dropping it...");
      await collection.dropIndex("user_1_shelter_1");
      console.log("Index dropped successfully.");
    } else {
      console.log("Legacy index 'user_1_shelter_1' not found. Nothing to drop.");
    }

    console.log("New indexes defined in Mongoose will be created automatically when the app starts.");
    
    process.exit(0);
  } catch (error) {
    console.error("Error fixing indexes:", error);
    process.exit(1);
  }
}

fixIndexes();
