import { Router } from "express";
import routesEmployees from "controllers/employees";

const router = Router();

router.use("/employees", routesEmployees);

export default router;
