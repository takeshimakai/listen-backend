import mongoose from 'mongoose';
const { Schema } = mongoose;

const MessageSchema = new Schema({
  sessionID: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  message: { type: String, required: true },
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now() }
});

export default mongoose.model('Message', MessageSchema);