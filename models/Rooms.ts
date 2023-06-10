import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  status: String,
});

module.exports = mongoose.models.Room || mongoose.model("Room", RoomSchema);
