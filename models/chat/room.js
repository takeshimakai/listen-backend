import mongoose from 'mongoose';
const { Schema } = mongoose;

const RoomSchema = new Schema({
  users: [String]
});

export default mongoose.model('Room', RoomSchema);