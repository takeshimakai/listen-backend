import mongoose from 'mongoose';
const { Schema } = mongoose;

const MessageSchema = new Schema({
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  message: { type: String, required: true },
  sentBy: { type: String, required: true },
  timestamp: { type: Date, default: Date.now() }
});

export default mongoose.model('Message', MessageSchema);