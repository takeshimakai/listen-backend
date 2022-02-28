import mongoose from 'mongoose';
const { Schema } = mongoose;

const MessageSchema = new Schema({
  roomID: { type: String, required: true },
  msg: { type: String },
  from: { type: String, required: true },
  timestamp: { type: Date, default: Date.now() }
});

export default mongoose.model('Message', MessageSchema);