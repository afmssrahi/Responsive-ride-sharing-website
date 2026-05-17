import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as chatService from './chat.service';
import { getIO } from '../../config/socket';

// GET /api/v1/chat/:rideId
export async function getConversation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { conversation, ride } = await chatService.getOrCreateConversation(
      req.params['rideId'] as string,
      req.user!.id
    );
    res.json({ success: true, data: { conversation, ride } });
  } catch (err) { next(err); }
}

// POST /api/v1/chat/:rideId/send
export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { message, conversationId } = await chatService.sendMessage(
      req.params['rideId'] as string,
      req.user!.id,
      req.body.body
    );

    // Emit via Socket.io to all users in this ride room
    const io = getIO();
    if (io) {
      io.to(`ride:${req.params['rideId']}`).emit('chat:message', message);
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) { next(err); }
}

// GET /api/v1/chat/unread-count
export async function getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const count = await chatService.getUnreadCount(req.user!.id);
    res.json({ success: true, data: { count } });
  } catch (err) { next(err); }
}
