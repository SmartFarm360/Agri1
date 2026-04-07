const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

const cleanEnv = (value) => String(value || "").trim();
const B2_REGION = cleanEnv(process.env.B2_REGION);
const B2_ENDPOINT =
  cleanEnv(process.env.B2_ENDPOINT) ||
  (B2_REGION ? `https://s3.${B2_REGION}.backblazeb2.com` : "");
const B2_BUCKET_NAME = cleanEnv(process.env.B2_BUCKET_NAME);
const B2_KEY_ID = cleanEnv(process.env.B2_KEY_ID);
const B2_APPLICATION_KEY = cleanEnv(process.env.B2_APPLICATION_KEY);

const hasBackblazeConfig =
  Boolean(B2_REGION) &&
  Boolean(B2_ENDPOINT) &&
  Boolean(B2_BUCKET_NAME) &&
  Boolean(B2_KEY_ID) &&
  Boolean(B2_APPLICATION_KEY);

const backblazeClient = hasBackblazeConfig
  ? new S3Client({
      region: B2_REGION,
      endpoint: B2_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APPLICATION_KEY,
      },
    })
  : null;

const uploadsRoot = path.join(__dirname, "..", "uploads");

function sanitizeSegment(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, "_"))
    .join("/");
}

function getBackendBaseUrl() {
  const explicit =
    cleanEnv(process.env.BACKEND_PUBLIC_URL) ||
    cleanEnv(process.env.API_BASE_URL);

  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  return `http://localhost:${cleanEnv(process.env.PORT) || "5000"}`;
}

function isNetworkTimeoutError(error) {
  if (!error) return false;

  const retryableCodes = new Set([
    "ETIMEDOUT",
    "ECONNRESET",
    "ECONNREFUSED",
    "ENETUNREACH",
    "EAI_AGAIN",
  ]);

  if (retryableCodes.has(error.code) || error.name === "TimeoutError") {
    return true;
  }

  if (Array.isArray(error.errors)) {
    return error.errors.some(isNetworkTimeoutError);
  }

  return false;
}

async function saveFileLocally(fileName, fileBuffer) {
  const safeRelativePath = sanitizeSegment(fileName);
  const absolutePath = path.join(uploadsRoot, safeRelativePath);

  await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.promises.writeFile(absolutePath, fileBuffer);

  return `${getBackendBaseUrl()}/uploads/${safeRelativePath}`;
}

const storage = multer.memoryStorage();

const cropImageUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

const landDocumentUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"), false);
    }
  },
});

const registerDocumentUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "landDocument") {
      if (file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new Error("Only PDF files are allowed for land documents."), false);
      }
      return;
    }

    cb(new Error("Unexpected upload field."), false);
  },
});

const uploadToBackblaze = async (fileName, fileBuffer, fileType) => {
  const safeFileName = sanitizeSegment(fileName);

  try {
    if (!backblazeClient) {
      throw new Error("Backblaze configuration is incomplete");
    }

    const uploadParams = {
      Bucket: B2_BUCKET_NAME,
      Key: safeFileName,
      Body: fileBuffer,
      ContentType: fileType,
    };

    await backblazeClient.send(new PutObjectCommand(uploadParams));

    return `${B2_ENDPOINT}/${B2_BUCKET_NAME}/${safeFileName}`;
  } catch (error) {
    const shouldFallback = true;

    console.error("Backblaze Upload Error:", {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      endpoint: B2_ENDPOINT || "(missing)",
      bucket: B2_BUCKET_NAME || "(missing)",
      retryableNetworkIssue: isNetworkTimeoutError(error),
      fallback: shouldFallback ? "local-file-storage" : "none",
    });

    if (shouldFallback) {
      const localUrl = await saveFileLocally(safeFileName, fileBuffer);
      console.warn(`Falling back to local upload storage for ${safeFileName}`);
      return localUrl;
    }

    throw new Error("Backblaze upload failed.");
  }
};

module.exports = {
  cropImageUpload,
  landDocumentUpload,
  registerDocumentUpload,
  uploadToBackblaze,
};
