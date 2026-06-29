export type IssueStatus = 'REPORTED' | 'VERIFIED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';

export type Category = 'POTHOLE' | 'GARBAGE' | 'WATER_LEAK' | 'STREETLIGHT' | 'ROAD_DAMAGE' | 'OTHER';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: Category;
  imageUrl: string;
  latitude: number;
  longitude: number;
  address: string;
  severity: Severity;
  priorityScore: number;
  department: string;
  status: IssueStatus;
  upvotes: string[]; // User IDs
  comments: Comment[];
  reportedBy: string; // User Name or ID
  reportedById: string;
  reportedAt: string;
  assignedTo?: string;
  resolvedAt?: string;
  resolvedImage?: string;
  isDuplicate?: boolean;
  duplicateOfId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CITIZEN' | 'ADMIN';
  points: number;
  badges: string[];
  joinedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  issueId: string;
  text: string;
  type: 'STATUS_CHANGE' | 'NEW_COMMENT' | 'DUPLICATE_FLAG' | 'VERIFICATION';
  isRead: boolean;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalIssues: number;
  resolvedIssues: number;
  resolutionRate: number; // percentage
  byCategory: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
  weeklyTrends: { date: string; reported: number; resolved: number }[];
  hotspots: { id: string; lat: number; lng: number; count: number; category: Category; severity: Severity }[];
  topContributors: { name: string; reports: number; points: number }[];
}
