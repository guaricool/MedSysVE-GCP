-- Drop the old unique index that was missed in 20260626130000_patient_workspace_tenant_isolation
DROP INDEX IF EXISTS "Patient_tipoIdentificacion_numeroIdentificacion_key";
