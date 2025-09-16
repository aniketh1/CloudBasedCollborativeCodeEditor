export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  structure: FileNode[];
}

export interface Collaborator {
  id: string;
  name: string;
  avatarUrl: string;
  color: string;
}