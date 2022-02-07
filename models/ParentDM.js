import mongoose from 'mongoose';
const { Schema } = mongoose;

const ParentDMSchema = new Schema({
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  body: { type: String, required: true },
  dateSent: { type: Date, default: Date.now() },
  read: [String],
  deleted: [String]
});

export default mongoose.model('ParentDM', ParentDMSchema);