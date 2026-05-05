// src/lib/audit.ts
import { PrismaClient } from '@prisma/client';

const getPrisma = () => new PrismaClient();

interface AuditLogData {
  userId: string;
  action: string;
  description: string;
  note?: string;
}

export async function writeAuditLog({ userId, action, description, note }: AuditLogData) {
  try {
    await getPrisma().tbl_audit_log.create({
      data: {
        id_pengguna: userId,
        aksi: action,
        deskripsi: description,
        note: note,
        waktu_aksi: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // In a production environment, you might want to log this error to an external service
    // or handle it differently to ensure auditability.
  }
}
