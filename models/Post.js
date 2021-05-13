import mongoose from 'mongoose';
const { Schema } = mongoose;

const PostSchema = new Schema({
  topics: {
    type: [String],
    enum: [
      'Neurodevelopmental disorders',
      'Bipolar and related disorders',
      'Anxiety disorders',
      'Stress related disorders',
      'Dissociative disorders',
      'Somatic symptoms disorders',
      'Eating disorders',
      'Sleep disorders',
      'Disruptive disorders',
      'Depressive disorders',
      'Substance related disorders',
      'Neurocognitive disorders',
      'Schizophrenia',
      'Obsessive-compulsive disorders',
      'Personality disorders',
      'Other'
    ],
    required: true
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  datePosted: { type: Date, required: true },
  dateEdited: Date,
  postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

export default mongoose.model('Post', PostSchema);