import RestRouter from "routes/rest-router";
import EmployeeMovements from "schemas/EmployeeMovements";

const router = RestRouter(EmployeeMovements, null, true);

export default router;
