/**
 * AWS S3 Configuration
 */

const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'retail-portal-uploads';

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} key - S3 object key (path/filename)
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<{url: string, key: string}>}
 */
const uploadToS3 = async (fileBuffer, key, contentType) => {
  console.log('[S3] Starting upload:', { key, contentType, bufferSize: fileBuffer?.length });
  
  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType
        // Note: ACL removed - bucket uses bucket policy for public access instead of ACLs
      }
    });

    const result = await upload.done();
    
    const url = result.Location || `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    console.log('[S3] Upload successful:', { url, key });
    
    return {
      url,
      key: key
    };
  } catch (error) {
    console.error('[S3] Upload failed:', error.message, error.Code);
    throw error;
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
const deleteFromS3 = async (key) => {
  if (!key) return;
  
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });

  await s3Client.send(command);
};

/**
 * Generate unique filename for upload
 * @param {string} originalName - Original filename
 * @param {string} folder - Folder path
 * @returns {string}
 */
const generateS3Key = (originalName, folder = 'categories') => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const sanitizedName = originalName
    .split('.')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .substring(0, 30);
  
  return `${folder}/${sanitizedName}-${timestamp}-${randomString}.${extension}`;
};

module.exports = {
  s3Client,
  uploadToS3,
  deleteFromS3,
  generateS3Key,
  BUCKET_NAME
};
