import { Router } from 'express';
import { submitFeedback } from '../controllers/feedbackController.js';

const router = Router();

router.post('/submit', submitFeedback);

export default router;
