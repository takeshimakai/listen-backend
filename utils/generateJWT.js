import jwt from 'jsonwebtoken';

const generateJWT = (user) => {
  const token = jwt.sign({
    id: user._id,
    username: user.profile.username,
    verified: user.auth.verification.verified
  }, process.env.JWT_SECRET, { expiresIn: '15m' });

  return token;
}

export default generateJWT;