
export interface Content {
  id: string;
  name: string;
  fileId: string;
  fileType: 'pdf' | 'txt';
  uploadedAt: Date;
}
