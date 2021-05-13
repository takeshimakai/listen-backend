import mongoose from 'mongoose';
const { Schema } = mongoose;

const CommentSchema = new Schema({
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  datePosted: Date,
  dateEdited: Date
});

export default mongoose.model('Comment', CommentSchema);