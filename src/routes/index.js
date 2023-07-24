import { Router } from "express";
const auth = require("middleware/auth");
import routesEmployees from "controllers/employees";

const router = Router();

router.use("/users", auth, routesEmployees);

export default router;
