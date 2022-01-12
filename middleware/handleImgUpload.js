import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500000 } });

const handleImgUpload = (req, res, next) => {
  upload.single('img')(req, res, async (err) => { 
    if (err instanceof multer.MulterError) {
      return res.status(413).json({ msg: 'File must be 0.5 MB or less.' });
    } else if (err) {
      return next(err);
    }
    next();
  })
}

export default handleImgUpload;