import mongoose from 'mongoose';
const { Schema } = mongoose;

const UserSchema = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  profile: {
    username: { type: String, required: true },
    age: Number,
    gender: { type: String, enum: ['Female', 'Male', 'Non-binary', 'Other'] },
    interests: { type: [String], default: undefined },
    problemTopics: {
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
      ]
    }
  }
});

export default mongoose.model('User', UserSchema);