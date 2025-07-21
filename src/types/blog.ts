export interface Blog {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  isSynced?: boolean; // Local only - indicates if the blog is synced with the server
}
