// backend/src/routes/api.js
import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import * as farmCtrl from '../controllers/farmController.js';
import * as advisoryCtrl from '../controllers/advisoryController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyAuth);

// Farm routes
router.get('/farms', farmCtrl.getFarms);
router.post('/farms', farmCtrl.createFarm);
router.put('/farms/:id', farmCtrl.updateFarm);
router.delete('/farms/:id', farmCtrl.deleteFarm);

// Advisory routes
router.get('/advisories', advisoryCtrl.listAdvisories);
router.get('/advisories/:id', advisoryCtrl.getAdvisory);
router.post('/advisories', advisoryCtrl.createAdvisory);

export default router;
