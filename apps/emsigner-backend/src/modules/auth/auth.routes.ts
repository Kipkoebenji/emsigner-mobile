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
router.post("/login", validateLogin, controller.login);
router.get("/me", authenticate, controller.me);
router.post(
  "/users",
  authenticate,
  authorize("CHAIRPERSON"),
  validateCreateUser,
  controller.createUser,
);

export default router;
