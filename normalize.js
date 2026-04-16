const mongoose = require("mongoose");
const Pet = require("./model/Pet");
require("dotenv").config();

async function normalize() {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/pet-adoption");
    const pets = await Pet.find({});
    console.log(`Normalizing ${pets.length} pets...`);

    for (const pet of pets) {
        let changed = false;

        // Size normalization
        let newSize = pet.size?.toLowerCase();
        if (newSize === "larger") newSize = "large";
        if (newSize && ["small", "medium", "large"].includes(newSize) && pet.size !== newSize) {
            pet.size = newSize;
            changed = true;
        }

        // Age normalization (Number -> Object)
        if (typeof pet.age !== "object") {
            pet.age = { value: Number(pet.age) || 0, unit: "years" };
            changed = true;
        }

        // Type normalization
        if (!pet.type) {
            pet.type = "adoption";
            changed = true;
        }

        if (changed) {
            console.log(`Updating pet: ${pet.name}`);
            await pet.save();
        }
    }

    // Normalize Messages
    const Message = require("./model/Message");
    const messages = await Message.find({ conversationId: { $exists: false } });
    console.log(`Normalizing ${messages.length} messages...`);

    for (const msg of messages) {
        if (msg.sender && msg.receiver) {
            msg.conversationId = [msg.sender.toString(), msg.receiver.toString()].sort().join("_");
            await msg.save();
        }
    }

    console.log("Normalization complete.");
    process.exit(0);
}

normalize();
