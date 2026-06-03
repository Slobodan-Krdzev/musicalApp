import { listDealMessages, markDealChatRead, sendDealMessage } from '../services/dealChatService.js';

export async function getDealChatMessages(req, res, next) {
  try {
    const { messages, partnerLastReadAt } = await listDealMessages(req.params.id, req.user._id);
    res.json({ success: true, messages, partnerLastReadAt });
  } catch (err) {
    next(err);
  }
}

export async function postDealChatRead(req, res, next) {
  try {
    const io = req.app.get('io');
    const readState = await markDealChatRead({
      applicationId: req.params.id,
      userId: req.user._id,
      io,
    });
    res.json({ success: true, readState });
  } catch (err) {
    next(err);
  }
}

export async function postDealChatMessage(req, res, next) {
  try {
    const { body } = req.body ?? {};
    const io = req.app.get('io');
    const message = await sendDealMessage({
      applicationId: req.params.id,
      senderId: req.user._id,
      body,
      io,
    });
    res.status(201).json({ success: true, message });
  } catch (err) {
    next(err);
  }
}
