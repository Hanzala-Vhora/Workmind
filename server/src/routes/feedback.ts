import { Router } from 'express';
import { submitFeedback, checkFeedbackStatus } from '../controllers/feedbackController.js';
import { requestCredits } from '../controllers/creditController.js';

const router = Router();

router.post('/submit', submitFeedback);
router.get('/check/:userId', checkFeedbackStatus);
router.post('/request-credits', requestCredits);

export default router;
