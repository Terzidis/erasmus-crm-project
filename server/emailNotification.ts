import { notifyOwner } from "./_core/notification";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export type EmailNotificationType = 
  | "new_deal" 
  | "deal_won" 
  | "deal_lost" 
  | "activity_overdue" 
  | "activity_due";

interface EmailNotificationPayload {
  type: EmailNotificationType;
  title: string;
  content: string;
  recipientUserId?: number;
  excludeUserId?: number;
}

/**
 * Get users who have email notifications enabled for a specific type
 */
async function getUsersWithEmailEnabled(
  type: EmailNotificationType,
  excludeUserId?: number
): Promise<Array<{ id: number; email: string | null; name: string | null }>> {
  const db = await getDb();
  if (!db) return [];

  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    emailNotifyNewDeal: users.emailNotifyNewDeal,
    emailNotifyDealWon: users.emailNotifyDealWon,
    emailNotifyDealLost: users.emailNotifyDealLost,
    emailNotifyOverdue: users.emailNotifyOverdue,
    emailNotifyActivityDue: users.emailNotifyActivityDue,
  }).from(users);

  return allUsers
    .filter(user => {
      // Exclude specific user if provided
      if (excludeUserId && user.id === excludeUserId) return false;
      
      // Check if user has email
      if (!user.email) return false;

      // Check notification preference based on type
      switch (type) {
        case "new_deal":
          return user.emailNotifyNewDeal;
        case "deal_won":
          return user.emailNotifyDealWon;
        case "deal_lost":
          return user.emailNotifyDealLost;
        case "activity_overdue":
          return user.emailNotifyOverdue;
        case "activity_due":
          return user.emailNotifyActivityDue;
        default:
          return false;
      }
    })
    .map(({ id, email, name }) => ({ id, email, name }));
}

/**
 * Send email notification to owner using Manus notification API
 * This sends a notification to the project owner who can then forward to relevant users
 */
export async function sendEmailNotification(payload: EmailNotificationPayload): Promise<boolean> {
  try {
    const eligibleUsers = await getUsersWithEmailEnabled(payload.type, payload.excludeUserId);
    
    if (eligibleUsers.length === 0) {
      console.log(`[EmailNotification] No eligible users for ${payload.type} notification`);
      return true;
    }

    // Build recipient list for the notification content
    const recipientNames = eligibleUsers
      .map(u => u.name || u.email || "User")
      .join(", ");

    const enrichedContent = `
${payload.content}

---
Recipients: ${recipientNames}
Notification Type: ${payload.type}
    `.trim();

    // Send notification to owner via Manus notification API
    const success = await notifyOwner({
      title: `[CRM] ${payload.title}`,
      content: enrichedContent,
    });

    if (success) {
      console.log(`[EmailNotification] Sent ${payload.type} notification to owner for ${eligibleUsers.length} users`);
    } else {
      console.warn(`[EmailNotification] Failed to send ${payload.type} notification`);
    }

    return success;
  } catch (error) {
    console.error("[EmailNotification] Error sending notification:", error);
    return false;
  }
}

/**
 * Send notification for new deal creation
 */
export async function notifyNewDeal(
  dealTitle: string,
  dealValue: string | null,
  creatorName: string,
  creatorId: number
): Promise<boolean> {
  const valueStr = dealValue ? `€${parseFloat(dealValue).toLocaleString()}` : "Not specified";
  
  return sendEmailNotification({
    type: "new_deal",
    title: "New Deal Created",
    content: `A new deal has been created in the CRM:

**Deal:** ${dealTitle}
**Value:** ${valueStr}
**Created by:** ${creatorName}

Log in to the CRM to view details and take action.`,
    excludeUserId: creatorId,
  });
}

/**
 * Send notification for deal won
 */
export async function notifyDealWon(
  dealTitle: string,
  dealValue: string | null,
  updaterName: string,
  updaterId: number
): Promise<boolean> {
  const valueStr = dealValue ? `€${parseFloat(dealValue).toLocaleString()}` : "Not specified";
  
  return sendEmailNotification({
    type: "deal_won",
    title: "🎉 Deal Won!",
    content: `Great news! A deal has been marked as WON:

**Deal:** ${dealTitle}
**Value:** ${valueStr}
**Updated by:** ${updaterName}

Congratulations to the team!`,
    excludeUserId: updaterId,
  });
}

/**
 * Send notification for deal lost
 */
export async function notifyDealLost(
  dealTitle: string,
  dealValue: string | null,
  lostReason: string | null,
  updaterName: string,
  updaterId: number
): Promise<boolean> {
  const valueStr = dealValue ? `€${parseFloat(dealValue).toLocaleString()}` : "Not specified";
  const reasonStr = lostReason || "Not specified";
  
  return sendEmailNotification({
    type: "deal_lost",
    title: "Deal Lost",
    content: `A deal has been marked as LOST:

**Deal:** ${dealTitle}
**Value:** ${valueStr}
**Reason:** ${reasonStr}
**Updated by:** ${updaterName}

Review the deal in the CRM for more details.`,
    excludeUserId: updaterId,
  });
}

/**
 * Send notification for overdue activities
 */
export async function notifyOverdueActivities(
  activities: Array<{ subject: string; dueDate: Date; ownerName: string }>,
  recipientId: number
): Promise<boolean> {
  if (activities.length === 0) return true;

  const activityList = activities
    .map(a => `- ${a.subject} (Due: ${a.dueDate.toLocaleDateString()})`)
    .join("\n");

  return sendEmailNotification({
    type: "activity_overdue",
    title: `⚠️ ${activities.length} Overdue Activities`,
    content: `You have overdue activities that need attention:

${activityList}

Please log in to the CRM to complete or reschedule these activities.`,
    recipientUserId: recipientId,
  });
}

/**
 * Send notification for upcoming activities (due today/tomorrow)
 */
export async function notifyUpcomingActivities(
  activities: Array<{ subject: string; dueDate: Date; type: string }>,
  recipientId: number
): Promise<boolean> {
  if (activities.length === 0) return true;

  const activityList = activities
    .map(a => `- [${a.type.toUpperCase()}] ${a.subject} (Due: ${a.dueDate.toLocaleDateString()})`)
    .join("\n");

  return sendEmailNotification({
    type: "activity_due",
    title: `📅 ${activities.length} Activities Due Soon`,
    content: `You have activities due soon:

${activityList}

Log in to the CRM to view details and complete these activities.`,
    recipientUserId: recipientId,
  });
}
