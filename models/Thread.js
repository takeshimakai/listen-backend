import mongoose from 'mongoose';
const { Schema } = mongoose;

const ThreadSchema = new Schema({
  subject: String,
  users: [String],
  lastUpdated: { type: Date, required: true },
  deleted: [String],
  msgs: { type: [Schema.Types.ObjectId], ref: 'DirectMsg' }
});

export default mongoose.model('Thread', ThreadSchema);