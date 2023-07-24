import RestRouter from "routes/rest-router";
import Employees from "schemas/Employees";

const router = RestRouter(Employees, null, true);

export default router;
