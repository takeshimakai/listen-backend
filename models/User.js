import mongoose from 'mongoose';
const { Schema } = mongoose;

const UserSchema = new Schema({
  auth: {
    email: String,
    password: String,
    googleId: String,
    verification: {
      code: String,
      verified: { type: Boolean, default: false }
    }
  },
  friends: {
    accepted: { type: [Schema.Types.ObjectId], ref: 'User' },
    received: { type: [Schema.Types.ObjectId], ref: 'User' },
    sent: { type: [Schema.Types.ObjectId], ref: 'User' }
  },
  chat: {
    isListener: { type: Boolean, default: false },
  },
  forum: {
    pinned: { type: [Schema.Types.ObjectId], ref: 'Post' }
  },
  profile: {
    username: String,
    dob: Date,
    gender: { type: String, enum: ['Female', 'Male', 'Non-binary', 'Other'] },
    interests: { type: [String] },
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
    },
    public: {
      type: [String],
      enum: [ 'dob', 'gender', 'interests', 'problemTopics']
    }
  }
});

UserSchema.virtual('age').get(function() {
  const today = new Date();
  const dob = new Date(this.profile.dob);
  let age = today.getFullYear() - dob.getFullYear();
  const month = today.getMonth() - dob.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
});

export default mongoose.model('User', UserSchema);