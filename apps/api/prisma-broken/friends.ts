import { Router } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/requireRole';
import {
  listFriends,
  createFriend,
  updateFriend,
  deleteFriend,
} from '../../controllers/admin/friendsController';

const router = Router();

// All routes in this file are for admins only
router.use(protect, requireRole(['ADMIN', 'SUPER_ADMIN']));

router.get('/list', listFriends);
router.post('/create', createFriend);
router.post('/update/:id', updateFriend);
router.delete('/delete/:id', deleteFriend);

export default router;