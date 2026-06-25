import { Router } from 'express';
import Notice from '../models/Notice.js';
import { buildTags, findMatches } from '../services/matching.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.json(notices);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      tags: buildTags(req.body)
    };

    const notice = await Notice.create(payload);
    const candidates = await Notice.find({ _id: { $ne: notice._id }, type: notice.type === 'lost' ? 'found' : 'lost' });
    const matches = findMatches(notice, candidates);

    res.status(201).json({ notice, matches });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/matches', async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    const candidates = await Notice.find({ _id: { $ne: notice._id }, type: notice.type === 'lost' ? 'found' : 'lost' });
    res.json(findMatches(notice, candidates));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/messages', async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    notice.messages.push({
      senderName: req.body.senderName || 'Anonymous neighbor',
      body: req.body.body
    });

    await notice.save();
    res.status(201).json(notice);
  } catch (error) {
    next(error);
  }
});

router.use((error, _req, res, _next) => {
  const status = error.name === 'ValidationError' ? 400 : 500;
  res.status(status).json({ message: error.message || 'Something went wrong' });
});

export default router;
