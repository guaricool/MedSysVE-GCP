import { router } from "../trpc"
import { authRouter } from "./auth"
import { doctorRouter } from "./doctor"
import { workspaceRouter } from "./workspace"
import { staffRouter } from "./staff"
import { patientRouter } from "./patient"
import { medicationRouter } from "./medication"
import { encounterRouter } from "./encounter"
import { icd10Router } from "./icd10"
import { prescriptionRouter } from "./prescription"
import { documentRouter } from "./document"
import { portalRouter } from "./portal"
import { appointmentRouter } from "./appointment"
import { invoiceRouter } from "./invoice"
import { clinicPublicRouter } from "./clinicPublic"
import { analyticsRouter } from "./analytics"
import { availabilityRouter } from "./availability"
import { labResultRouter } from "./labResult"
import { mensajeRouter } from "./mensaje"
import { alergiaRouter } from "./alergia"
import { labOrderRouter } from "./labOrder"
import { imagingOrderRouter } from "./imagingOrder"
import { templateRouter } from "./template"
import { tagRouter } from "./tag"
import { announcementRouter } from "./announcement"
import { staffNoteRouter } from "./staffNote"
import { vaccineRouter } from "./vaccine"
import { waitingRoomRouter } from "./waitingRoom"
import { notificationRouter } from "./notification"
import { taskRouter } from "./task"
import { insuranceRouter } from "./insurance"
import { consentRouter } from "./consent"
import { auditRouter } from "./audit"
import { adminRouter } from "./admin"
import { twoFactorRouter } from "./twoFactor"
import { complianceRouter } from "./compliance"
import { clinicAdminRouter } from "./clinicAdmin"
import { billingRouter } from "./billing"
import { featureFlagRouter } from "./feature-flag"
import { reportPreferencesRouter } from "./report-preferences"
import { expressOrderRouter } from "./expressOrder"
import { marketingRouter } from "./marketing"
import { adminMensajesRouter } from "./admin-mensajes"
import { marketplaceRouter } from "./marketplace"
import { orlRouter } from "./orl"
import { traumaRouter } from "./trauma"
import { cardioRouter } from "./cardio"
import { pediaRouter } from "./pedia"
import { obgynoRouter } from "./obgyno"
import { neuroRouter } from "./neuro"
import { endoRouter } from "./endo"
import { psychRouter } from "./psych"
import { dermRouter } from "./derm"
import { gastroRouter } from "./gastro"
import { anesthesiaRouter } from "./anesthesia"
import { surgeryRouter } from "./surgery"
import { infectoRouter } from "./infecto"
import { internalRouter } from "./internal"
import { pneumoRouter } from "./pneumo"
import { oncoRouter } from "./onco"
import { uroRouter } from "./uro"

export const appRouter = router({
  uro: uroRouter,
  onco: oncoRouter,
  pneumo: pneumoRouter,
  internal: internalRouter,
  infecto: infectoRouter,
  surgery: surgeryRouter,
  anesthesia: anesthesiaRouter,
  gastro: gastroRouter,
  derm: dermRouter,
  psych: psychRouter,
  endo: endoRouter,
  neuro: neuroRouter,
  obgyno: obgynoRouter,
  pedia: pediaRouter,
  cardio: cardioRouter,
  trauma: traumaRouter,
  orl: orlRouter,
  marketplace: marketplaceRouter,
  auth: authRouter,
  doctor: doctorRouter,
  workspace: workspaceRouter,
  staff: staffRouter,
  patient: patientRouter,
  medication: medicationRouter,
  encounter: encounterRouter,
  icd10: icd10Router,
  prescription: prescriptionRouter,
  document: documentRouter,
  portal: portalRouter,
  appointment: appointmentRouter,
  invoice: invoiceRouter,
  clinicPublic: clinicPublicRouter,
  analytics: analyticsRouter,
  availability: availabilityRouter,
  labResult: labResultRouter,
  mensaje: mensajeRouter,
  alergia: alergiaRouter,
  labOrder: labOrderRouter,
  imagingOrder: imagingOrderRouter,
  template: templateRouter,
  tag: tagRouter,
  announcement: announcementRouter,
  staffNote: staffNoteRouter,
  vaccine: vaccineRouter,
  waitingRoom: waitingRoomRouter,
  notification: notificationRouter,
  task: taskRouter,
  insurance: insuranceRouter,
  consent: consentRouter,
  audit: auditRouter,
  admin: adminRouter,
  twoFactor: twoFactorRouter,
  compliance: complianceRouter,
  clinicAdmin: clinicAdminRouter,
  billing: billingRouter,
  featureFlag: featureFlagRouter,
  reportPreferences: reportPreferencesRouter,
  expressOrder: expressOrderRouter,
  marketing: marketingRouter,
  adminMensajes: adminMensajesRouter,
})

export type AppRouter = typeof appRouter
