import mongoose from 'mongoose';

const connectMongoDB = () => {
  mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true , useUnifiedTopology: true});
  mongoose.set('useFindAndModify', false);
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
  db.once('open', () => console.log('MongoDB connected'));
};

export default connectMongoDB;