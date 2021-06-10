import mongoose from 'mongoose';
const { Schema } = mongoose;

const RoomSchema = new Schema({
  users: { type: [Schema.Types.ObjectId], ref: 'User' }
});

export default mongoose.model('Room', RoomSchema);