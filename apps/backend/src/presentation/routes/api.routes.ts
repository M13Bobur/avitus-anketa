import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../../application/services/auth.service';
import { applicationService } from '../../application/services/survey.service';
import { authMiddleware, requireMinRole } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import {
  loginSchema,
  updateApplicationStatusSchema,
  applicationFiltersSchema,
} from '../../application/dto/validation.schemas';
import { AdminRole } from '@avitus/shared-types';
import path from 'path';
import fs from 'fs';
import { config } from '../../config';

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Admin login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/auth/login',
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;
      const { token, admin } = await authService.login(username, password);
      res.json({
        success: true,
        data: {
          token,
          admin: {
            _id: admin._id.toString(),
            username: admin.username,
            role: admin.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current admin
 *     security:
 *       - bearerAuth: []
 */
router.get('/auth/me', authMiddleware, (req: Request, res: Response) => {
  res.json({ success: true, data: req.admin });
});

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard statistics
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/dashboard/stats',
  authMiddleware,
  requireMinRole(AdminRole.VIEWER),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await applicationService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /api/applications:
 *   get:
 *     tags: [Applications]
 *     summary: List applications with filters
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/applications',
  authMiddleware,
  requireMinRole(AdminRole.VIEWER),
  validateQuery(applicationFiltersSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await applicationService.getApplications(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     tags: [Applications]
 *     summary: Get application by ID
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/applications/:id',
  authMiddleware,
  requireMinRole(AdminRole.VIEWER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const app = await applicationService.getApplicationById(String(req.params.id));
      res.json({ success: true, data: app });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /api/applications/{id}/status:
 *   patch:
 *     tags: [Applications]
 *     summary: Update application status
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/applications/:id/status',
  authMiddleware,
  requireMinRole(AdminRole.ADMIN),
  validateBody(updateApplicationStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, adminComment } = req.body;
      const app = await applicationService.updateStatus(
        String(req.params.id),
        status,
        adminComment,
      );
      res.json({ success: true, data: app });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /api/files/{filename}:
 *   get:
 *     tags: [Files]
 *     summary: Download uploaded file
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/files/:filename',
  authMiddleware,
  requireMinRole(AdminRole.VIEWER),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const filename = path.basename(String(req.params.filename));
      const filePath = path.join(config.upload.dir, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File not found' });
      }

      res.download(filePath);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
