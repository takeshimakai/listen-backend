import mongoose from 'mongoose';
const { Schema } = mongoose;

const CommentSchema = new Schema({
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  replyTo: { type: Schema.Types.ObjectId, required: true},
  postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  datePosted: Date,
  dateEdited: Date,
  relatable: { type: [Schema.Types.ObjectId], ref: 'User' }
});

export default mongoose.model('Comment', CommentSchema);