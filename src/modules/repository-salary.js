import _ from "underscore";

import { db, deleteBody } from "modules";

const salary = {};

salary.getSalary = async (req, modelClass) => {
  const body = req.body;

  req.query = {
    filtersId: {
      employee: { value: body.employee },
    },
    filter: {
      month: {
        $in: [body.month],
      },
    },
    populate: ["employee"],
  };

  const movements = await db.getAll(req, modelClass);

  return movements;
};
const chofer = async (payload, model) => {};

const auxiliar = async (payload, model) => {};

const cargador = async (req, modelClass) => {};

export default salary;
