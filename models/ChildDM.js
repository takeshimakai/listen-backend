import mongoose from 'mongoose';
const { Schema } = mongoose;

const ChildDMSchema = new Schema({
  parentId: { type: String, required: true },
  replyTo: { type: String, required: true },
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  dateSent: { type: Date, default: Date.now() },
  read: [String]
});

export default mongoose.model('ChildDM', ChildDMSchema);