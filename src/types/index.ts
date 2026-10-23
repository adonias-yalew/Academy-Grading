// Domain models shared by UI, services and mocks. Shaped to map onto future REST DTOs.

export type Role = "subject_teacher" | "homeroom_teacher" | "director" | "admin";

export const ROLE_LABELS: Record<Role, string> = {
  subject_teacher: "Subject Teacher",
  homeroom_teacher: "Homeroom Teacher",
  director: "Director",
  admin: "Administrator",
};

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  roles: Role[];
  active: boolean;
}

export interface AcademicYear {
  id: string;
  label: string; // e.g. 2026/2027
  startDate: string;
  endDate: string;
  current: boolean;
}

export interface Term {
  id: string;
  name: string; // Semester 1
}

export interface Section {
  id: string;
  grade: number; // 1-12
  name: string; // A, B, C
  room: string;
  capacity: number;
  homeroomTeacherId: string | null;
}

export type StudentStatus = "active" | "inactive" | "transferred";
export type Gender = "M" | "F";

export interface Student {
  id: string;
  studentCode: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string;
  sectionId: string;
  status: StudentStatus;
  guardianName: string;
  guardianPhone: string;
}

export type AssessmentCategory = "quiz" | "assignment" | "project" | "midterm" | "final";

export const CATEGORY_LABELS: Record<AssessmentCategory, string> = {
  quiz: "Quiz",
  assignment: "Assignment",
  project: "Project",
  midterm: "Midterm Exam",
  final: "Final Exam",
};

export interface AssessmentDefinition {
  id: string;
  name: string;
  category: AssessmentCategory;
  maxMark: number;
  weight: number; // percentage contribution, all weights per subject sum to 100
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  grades: number[];
  assessments: AssessmentDefinition[];
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  sectionId: string;
}

export type MarkValue = number | null;

export type SheetStatus = "draft" | "submitted";

export interface MarkSheet {
  key: string; // `${yearId}|${termId}|${sectionId}|${subjectId}`
  status: SheetStatus;
  marks: Record<string, Record<string, MarkValue>>; // studentId -> assessmentId -> mark
  updatedAt: string | null;
  updatedBy: string | null;
}

export type ReportStatus =
  | "draft"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "returned"
  | "approved"
  | "finalized";

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  submitted: "Submitted",
  under_review: "Under Review",
  returned: "Returned for Correction",
  approved: "Approved",
  finalized: "Finalized",
};

export interface ReportHistoryEntry {
  at: string;
  byUserId: string;
  action: string;
  comment?: string;
}

export interface AcademicReport {
  id: string;
  yearId: string;
  termId: string;
  sectionId: string;
  status: ReportStatus;
  submittedBy: string | null;
  submittedAt: string | null;
  history: ReportHistoryEntry[];
}

export type NotificationCategory = "submission" | "missing_marks" | "returned" | "approved" | "system" | "task";

export interface AppNotification {
  id: string;
  userId: string | "all";
  category: NotificationCategory;
  title: string;
  body: string;
  at: string;
  read: boolean;
  link?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  record: string;
  details: string;
  at: string;
}

export interface GradeBand {
  min: number;
  letter: string;
  remark: string;
}

export interface SchoolSettings {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  passMark: number;
  rankingEnabled: boolean;
  gradeBands: GradeBand[];
}

export interface Session {
  userId: string;
  remember: boolean;
  issuedAt: string;
}
