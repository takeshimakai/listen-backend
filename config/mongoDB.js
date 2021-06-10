import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB, { useNewUrlParser: true , useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('MongoDB connected'));