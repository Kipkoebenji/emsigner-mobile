import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import * as controller from "./auth.controller.js";
import {
  validateCreateUser,
  validateLogin,
  validateRegistration,
} from "./auth.validation.js";

const router = Router();

router.post("/register", validateRegistration, controller.register);
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", validateLogin, controller.login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get the current authenticated user
 *     tags:
 *       - Authentication
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get("/me", authenticate, controller.me);
router.post(
  "/users",
  authenticate,
  authorize("CHAIRPERSON"),
  validateCreateUser,
  controller.createUser,
);

export default router;
