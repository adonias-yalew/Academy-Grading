import { format, formatDistanceToNowStrict } from "date-fns";
import type { Section } from "@/types";

export const sectionLabel = (s: Section | undefined) => (s ? `Grade ${s.grade}${s.name}` : "—");
export const fmtDate = (d: string | null | undefined) => (d ? format(new Date(d), "MMM d, yyyy") : "—");
export const fmtDateTime = (d: string | null | undefined) => (d ? format(new Date(d), "MMM d, yyyy · HH:mm") : "—");
export const fmtAgo = (d: string) => formatDistanceToNowStrict(new Date(d), { addSuffix: true });
export const fmtPct = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${n.toFixed(1)}%`);
export const initials = (name: string) =>
  name.replace(/^Dr\.\s*/, "").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
