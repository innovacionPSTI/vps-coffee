/**
 * Email helpers para apps/admin.
 * Todas las funciones provienen de @vps/database — re-exportadas aquí
 * para que los callers internos no cambien su ruta de importación.
 */
export type { EmailConfig } from '@vps/database'
export { sendShippingNotification, sendStatusNotification } from '@vps/database'
