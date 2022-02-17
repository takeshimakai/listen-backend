import mongoose from 'mongoose';
const { Schema } = mongoose;

const DirectMsgSchema = new Schema({
  threadId: { type: String, required: true },
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  dateSent: { type: Date, default: Date.now },
  read: [String]
});

export default mongoose.model('DirectMsg', DirectMsgSchema);