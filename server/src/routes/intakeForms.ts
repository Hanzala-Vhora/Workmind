// server/src/routes/intakeForms.ts
import { Router } from 'express';
import * as intakeFormController from '../controllers/intakeFormController.js';

const router = Router();

router.post('/', intakeFormController.createIntakeForm);
router.get('/', intakeFormController.getIntakeForms);
router.get('/:id', intakeFormController.getIntakeFormById);
router.put('/:id', intakeFormController.updateIntakeForm);
router.delete('/:id', intakeFormController.deleteIntakeForm);
router.post('/:id/submit', intakeFormController.submitIntakeForm);

export default router;
