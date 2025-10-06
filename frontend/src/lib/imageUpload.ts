import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Constants for image upload
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_WIDTH = 800; // Max width for compressed images
const MAX_HEIGHT = 600; // Max height for compressed images
const QUALITY = 0.8; // Compression quality (0.1 to 1.0)

export interface UploadedImage {
  imageUrl: string;
  filename: string;
  size: number;
  type: string;
}

/**
 * Compress image before upload
 */
export const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(blob!);
        },
        'image/jpeg',
        QUALITY
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validate image file
 */
export const validateImage = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipe file tidak valid. Hanya JPEG, PNG, dan WebP yang diperbolehkan.'
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Ukuran file terlalu besar. Maksimal ukuran adalah ${MAX_FILE_SIZE / 1024 / 1024}MB.`
    };
  }

  return { valid: true };
};

/**
 * Upload image to server
 */
export const uploadMenuImage = async (file: File): Promise<UploadedImage> => {
  // Validate file
  const validation = validateImage(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    // Compress image
    const compressedBlob = await compressImage(file);
    const compressedFile = new File([compressedBlob], file.name, {
      type: 'image/jpeg',
      lastModified: Date.now()
    });

    console.log(`Original size: ${file.size}, Compressed size: ${compressedFile.size}`);

    // Create form data
    const formData = new FormData();
    formData.append('image', compressedFile);

    // Get auth token
    const token = localStorage.getItem('warungAuthToken');

    // Upload to server
    const response = await axios.post(`${API_URL}/api/upload/menu-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Upload gagal');
    }

  } catch (error) {
    console.error('Upload error:', error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Silakan login kembali');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.error || 'File tidak valid');
      } else if (error.response?.status === 413) {
        throw new Error('File terlalu besar');
      } else if (error.response && error.response.status >= 500) {
        throw new Error('Server error: Silakan coba lagi nanti');
      }
    }

    throw new Error(error instanceof Error ? error.message : 'Upload gagal');
  }
};

/**
 * Delete image from server
 */
export const deleteMenuImage = async (imageUrl: string): Promise<void> => {
  try {
    const token = localStorage.getItem('warungAuthToken');

    await axios.delete(`${API_URL}/api/upload/menu-image`, {
      data: { imageUrl },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

  } catch (error) {
    console.error('Delete image error:', error);
    throw new Error(error instanceof Error ? error.message : 'Gagal menghapus gambar');
  }
};

/**
 * Convert file to Base64 (fallback for local storage)
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Handle image upload with fallback to Base64 for offline mode
 */
export const handleImageUpload = async (file: File): Promise<string> => {
  try {
    // Try to upload to server first
    const uploadedImage = await uploadMenuImage(file);
    return uploadedImage.imageUrl;
  } catch (error) {
    console.warn('Server upload failed, falling back to Base64:', error);

    // Fallback to Base64 for offline mode
    const base64 = await fileToBase64(file);
    return base64;
  }
};