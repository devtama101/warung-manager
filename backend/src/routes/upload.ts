import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { mkdir, writeFile, stat, readdir, unlink } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const upload = new Hono();

// Constants for file upload
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB per image
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_DIR = 'uploads/menu-images';
const MAX_IMAGES_PER_USER = 100; // Prevent storage abuse

// All upload routes require authentication
upload.use('/*', authMiddleware);

// Create upload directory if it doesn't exist
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directory:', error);
  }
}

// Validate file
function validateFile(buffer: ArrayBuffer, mimeType: string): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' };
  }

  // Check file size
  if (buffer.byteLength > MAX_FILE_SIZE) {
    return { valid: false, error: `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` };
  }

  return { valid: true };
}

// Upload menu image
upload.post('/menu-image', async (c) => {
  try {
    await ensureUploadDir();

    const formData = await c.req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return c.json({ error: 'No image file provided' }, 400);
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Validate file
    const validation = validateFile(buffer, file.type);
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    // Get user info for directory structure
    const user = c.get('user');
    const userDir = join(UPLOAD_DIR, `user-${user.id}`);

    // Create user directory
    await mkdir(userDir, { recursive: true });

    // Check user image count to prevent abuse
    try {
      const userFiles = await readdir(userDir);
      if (userFiles.length >= MAX_IMAGES_PER_USER) {
        return c.json({
          error: `Maximum image limit reached (${MAX_IMAGES_PER_USER} images). Please delete some images first.`
        }, 400);
      }
    } catch (error) {
      // Directory might not exist yet, which is fine
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const filePath = join(userDir, uniqueFilename);

    // Write file to disk
    await writeFile(filePath, uint8Array);

    // Return the relative URL that can be used to access the image
    const imageUrl = `/uploads/menu-images/user-${user.id}/${uniqueFilename}`;

    return c.json({
      success: true,
      data: {
        imageUrl,
        filename: uniqueFilename,
        size: buffer.byteLength,
        type: file.type
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

// Delete menu image
upload.delete('/menu-image', async (c) => {
  try {
    const { imageUrl } = await c.req.json();

    if (!imageUrl) {
      return c.json({ error: 'Image URL is required' }, 400);
    }

    // Validate that the image belongs to the user
    const user = c.get('user');
    const expectedPrefix = `/uploads/menu-images/user-${user.id}/`;

    if (!imageUrl.startsWith(expectedPrefix)) {
      return c.json({ error: 'Invalid image URL' }, 403);
    }

    // Construct file path
    const filePath = join(UPLOAD_DIR, imageUrl.replace('/uploads/', ''));

    // Check if file exists
    try {
      await stat(filePath);
    } catch (error) {
      return c.json({ error: 'Image not found' }, 404);
    }

    // Delete file
    await unlink(filePath);

    return c.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return c.json({ error: 'Failed to delete image' }, 500);
  }
});

export default upload;