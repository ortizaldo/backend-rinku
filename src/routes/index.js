import { Router } from "express";
import routesEmployees from "controllers/employees";
import routesEmployeeMovements from "controllers/employeeMovements";

const router = Router();

router.use("/employees", routesEmployees);
router.use("/employee-movements", routesEmployeeMovements);
router.use("/employee-salary", routesEmployeeMovements);

export default router;
