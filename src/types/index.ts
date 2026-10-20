export type UserRole = 'citizen' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export type RequestCategory =
  | 'Broken Streetlight'
  | 'Water & Sewage'
  | 'Garbage Collection'
  | 'Road Pothole'
  | 'Public Health'
  | 'Parks & Green Spaces'
  | 'Other';

export type RequestStatus = 'Pending' | 'In Progress' | 'Resolved';

export interface ServiceRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  category: RequestCategory;
  location: string;
  description: string;
  imageUrl?: string;
  imageBase64?: string;
  status: RequestStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

export const CATEGORIES: { label: RequestCategory; icon: string; description: string }[] = [
  { label: 'Broken Streetlight', icon: 'Lightbulb', description: 'Faulty lamps, dark alleys, flickering posts' },
  { label: 'Water & Sewage', icon: 'Droplets', description: 'Burst pipes, contaminated supply, blocked drains' },
  { label: 'Garbage Collection', icon: 'Trash2', description: 'Overflowing bins, uncollected waste, illegal dumping' },
  { label: 'Road Pothole', icon: 'Car', description: 'Damaged pavement, hazardous craters, damaged curbs' },
  { label: 'Public Health', icon: 'HeartPulse', description: 'Sanitation concerns, pest hazards, community hygiene' },
  { label: 'Parks & Green Spaces', icon: 'Trees', description: 'Overgrown vegetation, broken benches, playground issues' },
  { label: 'Other', icon: 'HelpCircle', description: 'General municipal issues and public maintenance' },
];
