import mongoose from 'mongoose';
const { Schema } = mongoose;

const CommentSchema = new Schema({
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  datePosted: { type: Date, default: Date.now() }
});

export default mongoose.model('Comment', CommentSchema);