import prisma from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../shared/errors';

// ── Get or create a conversation for a ride ──────────────────────────
export async function getOrCreateConversation(rideId: string, userId: string) {
  // Verify the ride exists and the user is a participant
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      participants: true,
      shareRequests: true,
    },
  });
  if (!ride) throw new NotFoundError('Ride not found');

  // Allow creator, driver, or approved participants to access chat
  const isCreator = ride.creatorId === userId;
  const isDriver = ride.driverId === userId;
  const isParticipant = ride.participants.some(p => p.userId === userId);

  if (!isCreator && !isDriver && !isParticipant) {
    throw new ForbiddenError('You are not part of this ride');
  }

  // Upsert conversation
  const conversation = await prisma.conversation.upsert({
    where: { rideId },
    update: {},
    create: { rideId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, name: true, avatar: true, role: true } },
        },
      },
    },
  });

  // Mark all unread messages (not sent by this user) as read
  await prisma.message.updateMany({
    where: { conversationId: conversation.id, senderId: { not: userId }, isRead: false },
    data: { isRead: true },
  });

  return { conversation, ride };
}

// ── Send a message ────────────────────────────────────────────────────
export async function sendMessage(rideId: string, senderId: string, body: string) {
  if (!body?.trim()) throw new Error('Message body cannot be empty');

  // Ensure conversation exists
  const conversation = await prisma.conversation.upsert({
    where: { rideId },
    update: {},
    create: { rideId },
  });

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId,
      body: body.trim(),
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true, role: true } },
    },
  });

  return { message, conversationId: conversation.id };
}

// ── Get unread count for a user ────────────────────────────────────────
export async function getUnreadCount(userId: string) {
  // Find all conversations for rides where user is involved
  const rides = await prisma.ride.findMany({
    where: {
      OR: [
        { creatorId: userId },
        { driverId: userId },
        { participants: { some: { userId } } },
      ],
    },
    select: { id: true },
  });

  const rideIds = rides.map(r => r.id);

  const conversations = await prisma.conversation.findMany({
    where: { rideId: { in: rideIds } },
    select: { id: true },
  });

  const conversationIds = conversations.map(c => c.id);

  const count = await prisma.message.count({
    where: {
      conversationId: { in: conversationIds },
      senderId: { not: userId },
      isRead: false,
    },
  });

  return count;
}
