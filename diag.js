const mongoose = require("mongoose");
const Pet = require("./model/Pet");
require("dotenv").config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/pet-adoption");
    const pets = await Pet.find({});
    console.log("Total pets:", pets.length);
    const sizes = [...new Set(pets.map(p => p.size))];
    console.log("Found sizes in DB:", sizes);

    const ages = pets.map(p => ({ name: p.name, age: p.age, size: p.size }));
    console.log("Sample Data (Ages/Sizes):", ages.slice(0, 10));

    process.exit(0);
}

check();
