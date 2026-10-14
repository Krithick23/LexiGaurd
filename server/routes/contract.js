import express from 'express';
import {
  uploadAndAnalyze,
  getContracts,
  getContractById,
  deleteContract,
  compareContracts,
  getUserStats,
  loadSampleContract,
} from '../controllers/contractController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { validate, compareContractsSchema } from '../middleware/validateRequest.js';

const router = express.Router();

// All contract operations are protected
router.use(protect);

router.post('/upload', upload.single('file'), uploadAndAnalyze);
router.get('/', getContracts);
router.get('/stats', getUserStats);
router.post('/sample-demo', loadSampleContract);
router.post('/compare', validate(compareContractsSchema), compareContracts);
router.get('/:id', getContractById);
router.delete('/:id', deleteContract);

export default router;
