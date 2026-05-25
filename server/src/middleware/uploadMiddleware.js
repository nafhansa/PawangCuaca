const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { ValidationError } = require('../utils/errors');

const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif'];
const ALLOWED_VIDEO_TYPES = ['.mp4', '.webm'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = crypto.randomUUID() + ext;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allAllowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
  if (!allAllowed.includes(ext)) {
    return cb(new ValidationError('Tipe file tidak didukung. Gunakan JPG, PNG, GIF, MP4, atau WebM.'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_VIDEO_SIZE },
});

const uploadMedia = upload.single('media');

const uploadMiddleware = (req, res, next) => {
  uploadMedia(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ValidationError('Ukuran file terlalu besar. Maksimal 50MB untuk video, 10MB untuk gambar.'));
      }
      return next(new ValidationError('Error saat mengunggah file.'));
    }
    if (err) {
      return next(err);
    }

    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ALLOWED_IMAGE_TYPES.includes(ext) && req.file.size > MAX_IMAGE_SIZE) {
        return next(new ValidationError('Ukuran gambar terlalu besar. Maksimal 10MB.'));
      }
      req.mediaInfo = {
        url: `/uploads/${req.file.filename}`,
        type: ALLOWED_VIDEO_TYPES.includes(ext) ? 'video' : (ext === '.gif' ? 'gif' : 'image'),
        size: req.file.size,
      };
    }
    next();
  });
};

module.exports = uploadMiddleware;