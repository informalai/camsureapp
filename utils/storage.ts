import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PhotoMetadata {
  id: string;
  filename: string;
  timestamp: number;
  uri: string;
  hasStickers: boolean;
  stickerCount?: number;
  fileSize?: number;
}

class AppStorage {
  private static instance: AppStorage;
  private photosDir: string;
  private metadataKey = '@camsure_photos_metadata';

  constructor() {
    this.photosDir = `${FileSystem.documentDirectory}camsure_photos/`;
  }

  static getInstance(): AppStorage {
    if (!AppStorage.instance) {
      AppStorage.instance = new AppStorage();
    }
    return AppStorage.instance;
  }

  async ensureDirectoryExists(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this.photosDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.photosDir, { intermediates: true });
    }
  }

  async savePhoto(sourceUri: string, hasStickers = false, stickerCount = 0): Promise<PhotoMetadata | null> {
    try {
      console.log('Starting photo save process...', { sourceUri, hasStickers, stickerCount });
      
      await this.ensureDirectoryExists();
      console.log('Directory ensured');
      
      const timestamp = Date.now();
      const filename = `photo_${timestamp}.png`; // Change to PNG for better compatibility
      const targetUri = `${this.photosDir}${filename}`;
      
      console.log('Copying file from', sourceUri, 'to', targetUri);
      
      // Copy the photo to app storage
      await FileSystem.copyAsync({
        from: sourceUri,
        to: targetUri,
      });
      
      console.log('File copied successfully');

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(targetUri);
      console.log('File info:', fileInfo);
      
      const metadata: PhotoMetadata = {
        id: timestamp.toString(),
        filename,
        timestamp,
        uri: targetUri,
        hasStickers,
        stickerCount,
        fileSize: fileInfo.size || 0,
      };

      // Save metadata
      await this.savePhotoMetadata(metadata);
      console.log('Metadata saved successfully');
      
      return metadata;
    } catch (error) {
      console.error('Error saving photo to app storage:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return null;
    }
  }

  async getAllPhotos(): Promise<PhotoMetadata[]> {
    try {
      const metadataJson = await AsyncStorage.getItem(this.metadataKey);
      if (!metadataJson) return [];
      
      const allMetadata: PhotoMetadata[] = JSON.parse(metadataJson);
      
      // Verify files still exist and filter out missing ones
      const validPhotos: PhotoMetadata[] = [];
      for (const photo of allMetadata) {
        const fileInfo = await FileSystem.getInfoAsync(photo.uri);
        if (fileInfo.exists) {
          validPhotos.push(photo);
        }
      }
      
      // Update metadata if any files were missing
      if (validPhotos.length !== allMetadata.length) {
        await this.saveAllPhotoMetadata(validPhotos);
      }
      
      // Sort by timestamp (newest first)
      return validPhotos.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error retrieving photos:', error);
      return [];
    }
  }

  async deletePhoto(photoId: string): Promise<boolean> {
    try {
      const allPhotos = await this.getAllPhotos();
      const photoToDelete = allPhotos.find(p => p.id === photoId);
      
      if (!photoToDelete) return false;
      
      // Delete the file
      await FileSystem.deleteAsync(photoToDelete.uri, { idempotent: true });
      
      // Remove from metadata
      const updatedPhotos = allPhotos.filter(p => p.id !== photoId);
      await this.saveAllPhotoMetadata(updatedPhotos);
      
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      return false;
    }
  }

  async getStorageInfo(): Promise<{ totalPhotos: number; totalSize: number }> {
    try {
      const photos = await this.getAllPhotos();
      const totalSize = photos.reduce((sum, photo) => sum + (photo.fileSize || 0), 0);
      
      return {
        totalPhotos: photos.length,
        totalSize,
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { totalPhotos: 0, totalSize: 0 };
    }
  }

  async clearAllPhotos(): Promise<boolean> {
    try {
      // Delete the entire photos directory
      await FileSystem.deleteAsync(this.photosDir, { idempotent: true });
      
      // Clear metadata
      await AsyncStorage.removeItem(this.metadataKey);
      
      return true;
    } catch (error) {
      console.error('Error clearing all photos:', error);
      return false;
    }
  }

  private async savePhotoMetadata(metadata: PhotoMetadata): Promise<void> {
    const allPhotos = await this.getAllPhotos();
    allPhotos.unshift(metadata); // Add to beginning (newest first)
    await this.saveAllPhotoMetadata(allPhotos);
  }

  private async saveAllPhotoMetadata(photos: PhotoMetadata[]): Promise<void> {
    await AsyncStorage.setItem(this.metadataKey, JSON.stringify(photos));
  }

  // Utility method to format file size
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Utility method to format date
  static formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const photoDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (photoDate.getTime() === today.getTime()) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (photoDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
}

const appStorageInstance = AppStorage.getInstance();
export default appStorageInstance;
export { AppStorage };