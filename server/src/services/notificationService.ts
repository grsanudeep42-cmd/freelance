import { prisma } from "./postgres";

type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
};

export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link ?? null,
        isRead: false,
      },
    });
  } catch (err) {
    // Never throw — notifications are non-critical
    console.error("Failed to create notification:", err);
  }
}
