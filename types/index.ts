import type { ClinicAdminRole } from "@prisma/client"

export type UserRole =
  | "DOCTOR"
  | "SECRETARY"
  | "ASSISTANT"
  | "NURSE"
  | "PATIENT"
  /**
   * Non-doctor administrator of a Clinic (OWNER or MANAGER). Has access to
   * the clinic dashboard to manage staff, rotate invitation codes, and view
   * billing. Does NOT have a medical license and never appears in the doctor
   * referral picker.
   */
  | "CLINIC_ADMIN"

export interface SessionUser {
  id: string
  email: string
  nombre: string
  apellido: string
  role: UserRole
  /**
   * For DOCTOR/STAFF/PATIENT: the workspace scope. For CLINIC_ADMIN: we
   * leave this empty string and use `clinicId` for routing instead — admins
   * don't belong to a single workspace, they belong to a clinic.
   */
  workspaceId: string
  /** Set for DOCTOR + STAFF (points to the clinic-owning doctor). */
  doctorId: string
  /** Set only when role === "PATIENT". */
  patientId?: string
  /**
   * Set only when role === "CLINIC_ADMIN". The admin's session lives in the
   * clinic's tenant scope, not a workspace's. All admin-only tRPC procedures
   * filter by this clinicId.
   */
  clinicId?: string
  /** Set only when role === "CLINIC_ADMIN". The ClinicAdmin row id. */
  clinicAdminId?: string
  /**
   * Set only when role === "CLINIC_ADMIN". Distinguishes OWNER (full control
   * including rotating invitation code, adding MANAGERs, deleting clinic)
   * from MANAGER (operational access without destructive actions).
   */
  clinicAdminRole?: ClinicAdminRole
}
