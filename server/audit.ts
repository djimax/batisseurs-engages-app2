import { getDb } from "./db";
import { auditLogs } from "../drizzle/schema";

type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Log an audit entry for tracking modifications
 */
export async function logAudit(
  data: Omit<InsertAuditLog, "createdAt">
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(auditLogs).values({
      ...data,
    });
  } catch (error) {
    console.error("Failed to log audit entry:", error);
    // Don't throw - audit logging should not break the main operation
  }
}

/**
 * Log a document modification
 */
export async function logDocumentAudit(
  userId: number | undefined,
  userEmail: string | undefined,
  action: "CREATE" | "UPDATE" | "DELETE",
  documentId: number,
  documentTitle: string,
  oldValue?: Record<string, any>,
  newValue?: Record<string, any>
): Promise<void> {
  await logAudit({
    userId,
    userEmail,
    action,
    entityType: "documents",
    entityId: documentId,
    entityName: documentTitle,
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    description: `${action} document: ${documentTitle}`,
    status: "success",
  });
}

/**
 * Log a member modification
 */
export async function logMemberAudit(
  userId: number | undefined,
  userEmail: string | undefined,
  action: "CREATE" | "UPDATE" | "DELETE",
  memberId: number,
  memberName: string,
  oldValue?: Record<string, any>,
  newValue?: Record<string, any>
): Promise<void> {
  await logAudit({
    userId,
    userEmail,
    action,
    entityType: "members",
    entityId: memberId,
    entityName: memberName,
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    description: `${action} member: ${memberName}`,
    status: "success",
  });
}

/**
 * Log a finance transaction
 */
export async function logFinanceAudit(
  userId: number | undefined,
  userEmail: string | undefined,
  action: "CREATE" | "UPDATE" | "DELETE",
  transactionId: number,
  transactionType: string,
  amount: number,
  oldValue?: Record<string, any>,
  newValue?: Record<string, any>
): Promise<void> {
  await logAudit({
    userId,
    userEmail,
    action,
    entityType: "finances",
    entityId: transactionId,
    entityName: `${transactionType} - ${amount}€`,
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    description: `${action} transaction: ${transactionType} - ${amount}€`,
    status: "success",
  });
}

/**
 * Log a user management action
 */
export async function logUserAudit(
  userId: number | undefined,
  userEmail: string | undefined,
  action: "CREATE" | "UPDATE" | "DELETE",
  targetUserId: number,
  targetUserEmail: string,
  oldValue?: Record<string, any>,
  newValue?: Record<string, any>
): Promise<void> {
  await logAudit({
    userId,
    userEmail,
    action,
    entityType: "users",
    entityId: targetUserId,
    entityName: targetUserEmail,
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    description: `${action} user: ${targetUserEmail}`,
    status: "success",
  });
}

/**
 * Log a login event
 */
export async function logLoginAudit(
  userId: number | undefined,
  userEmail: string | undefined
): Promise<void> {
  await logAudit({
    userId,
    userEmail,
    action: "LOGIN",
    entityType: "auth",
    description: `User login: ${userEmail}`,
    status: "success",
  });
}

/**
 * Log an export action
 */
export async function logExportAudit(
  userId: number | undefined,
  userEmail: string | undefined,
  exportType: string
): Promise<void> {
  await logAudit({
    userId,
    userEmail,
    action: "EXPORT",
    entityType: exportType,
    description: `Exported ${exportType}`,
    status: "success",
  });
}

/**
 * Log an import action
 */
export async function logImportAudit(
  userId: number | undefined,
  userEmail: string | undefined,
  importType: string,
  recordCount: number
): Promise<void> {
  await logAudit({
    userId,
    userEmail,
    action: "IMPORT",
    entityType: importType,
    description: `Imported ${recordCount} records to ${importType}`,
    status: "success",
  });
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(
  filters?: {
    userId?: number;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(auditLogs);

  if (filters?.userId) {
    query = query.where((col: any) => col.userId === filters.userId);
  }

  if (filters?.action) {
    query = query.where((col: any) => col.action === filters.action);
  }

  if (filters?.entityType) {
    query = query.where((col: any) => col.entityType === filters.entityType);
  }

  if (filters?.startDate) {
    query = query.where((col: any) => col.createdAt >= filters.startDate!);
  }

  if (filters?.endDate) {
    query = query.where((col: any) => col.createdAt <= filters.endDate!);
  }

  const limit = filters?.limit || 100;
  const offset = filters?.offset || 0;

  return query.orderBy((col: any) => col.createdAt).limit(limit).offset(offset);
}
