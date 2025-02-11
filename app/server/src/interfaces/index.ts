export interface DocumentAttributes {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  size: number;
  uploadDate: Date;
  summary?: string;
  references?: string[];
  processed: boolean;
}
