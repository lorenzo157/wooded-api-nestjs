export interface FileUploadResult {
  url: string;
  filePath: string;
}

export interface IFileStorageService {
  uploadFile(fileData: string, filePath: string): Promise<FileUploadResult>;
  deleteFile(filePath: string): Promise<void>;
  getFileUrl(filePath: string): string;
}
