import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'listen.app.test@gmail.com',
    pass: process.env.MAIL_PASS
  }
});

export default transporter;