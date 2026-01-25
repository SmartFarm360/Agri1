const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// ✅ Backblaze S3-Compatible Client Setup
const backblazeClient = new S3Client({
  region: process.env.B2_REGION,
  endpoint: process.env.B2_ENDPOINT, // This is the Backblaze S3 API endpoint
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY
  }
});

// ✅ Memory storage (files stored in memory, not on disk)
const storage = multer.memoryStorage();

// ✅ Crop image upload (images only)
const cropImageUpload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// ✅ Land document upload (PDF files only)
const landDocumentUpload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// ✅ Upload function for Backblaze B2
const uploadToBackblaze = async (fileName, fileBuffer, fileType) => {
  try {
    const uploadParams = {
      Bucket: process.env.B2_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: fileType
    };

    await backblazeClient.send(new PutObjectCommand(uploadParams));

    // ✅ Correct URL: Include the bucket name in the path
    return `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${fileName}`;
  } catch (error) {
    console.error('Backblaze Upload Error:', error);
    throw new Error('Backblaze upload failed.');
  }
};


module.exports = { cropImageUpload, landDocumentUpload, uploadToBackblaze };
