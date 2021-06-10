import mongoose from 'mongoose';
const { Schema } = mongoose;

const WaitingListSchema = new Schema({
  users: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }]
});

export default mongoose.model('WaitingList', WaitingListSchema);