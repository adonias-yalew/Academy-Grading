// Frontend-only permission checks for showing/hiding UI. The backend must enforce the same rules.
import type { AcademicReport, ReportStatus, Role, Section, TeacherAssignment, User } from "@/types";

export type Permission =
  | "students.manage"
  | "classes.manage"
  | "subjects.manage"
  | "assignments.manage"
  | "grades.enter"
  | "grades.viewAll"
  | "reports.view"
  | "reports.viewAll"
  | "reports.review"
  | "reports.finalize"
  | "logs.view"
  | "settings.manage";

const MATRIX: Record<Role, Permission[]> = {
  subject_teacher: ["grades.enter"],
  homeroom_teacher: ["reports.view"],
  director: ["assignments.manage", "grades.viewAll", "reports.view", "reports.viewAll", "reports.review", "reports.finalize", "logs.view"],
  admin: ["students.manage", "classes.manage", "subjects.manage", "assignments.manage", "grades.viewAll", "reports.view", "reports.viewAll", "reports.finalize", "logs.view", "settings.manage"],
};

export function can(user: User | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  return user.roles.some((r) => MATRIX[r].includes(permission));
}

export const hasRole = (user: User | null | undefined, role: Role) => !!user?.roles.includes(role);

export function canEditSheet(user: User | null | undefined, assignment: TeacherAssignment | undefined): boolean {
  return !!user && !!assignment && hasRole(user, "subject_teacher") && assignment.teacherId === user.id;
}

export const isHomeroomOf = (user: User | null | undefined, section: Section | undefined) =>
  !!user && !!section && hasRole(user, "homeroom_teacher") && section.homeroomTeacherId === user.id;

export type ReportAction = "submit" | "start_review" | "approve" | "return" | "finalize";

const EDITABLE: ReportStatus[] = ["draft", "in_progress", "returned"];

export interface ActionAvailability {
  action: ReportAction;
  enabled: boolean;
  reason?: string;
}

/** Which workflow actions the user may see for a report, and whether each is currently allowed. */
export function reportActions(user: User | null | undefined, report: AcademicReport, section: Section | undefined, complete: boolean): ActionAvailability[] {
  const out: ActionAvailability[] = [];
  if (!user) return out;
  if (isHomeroomOf(user, section) && EDITABLE.includes(report.status)) {
    out.push(complete ? { action: "submit", enabled: true } : { action: "submit", enabled: false, reason: "All subject marks must be entered and submitted by subject teachers first." });
  }
  if (can(user, "reports.review")) {
    if (report.status === "submitted") out.push({ action: "start_review", enabled: true });
    if (report.status === "submitted" || report.status === "under_review") {
      out.push(complete ? { action: "approve", enabled: true } : { action: "approve", enabled: false, reason: "Cannot approve while marks are missing." });
      out.push({ action: "return", enabled: true });
    }
  }
  if (can(user, "reports.finalize") && report.status === "approved") out.push({ action: "finalize", enabled: true });
  return out;
}

export const NEXT_STATUS: Record<ReportAction, ReportStatus> = {
  submit: "submitted",
  start_review: "under_review",
  approve: "approved",
  return: "returned",
  finalize: "finalized",
};
