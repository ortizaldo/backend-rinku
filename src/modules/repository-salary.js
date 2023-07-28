import _ from "underscore";

import { db } from "modules";

const salary = {};

salary.getSalary = async (req, modelClass) => {
  const sueldoBase = 30;
  const horasLaborales = 8;
  const diasSemanales = 6;
  const bonoChofer = 10;
  const bonoCargador = 5;
  const pagoCEntrega = 5;
  const retencionISR = 0.09;
  const retencionISRAdicional = 0.03;
  const valesDespensa = 0.04;
  const semanasPorMes = 4;

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

  console.log(
    "%crepository-salary.js line:33 req.query ",
    "color: #007acc;",
    req.query
  );

  const movements = await db.getAll(req, modelClass);
  console.log(
    "🚀 ~ file: repository-salary.js:34 ~ salary.getSalary= ~ movements:",
    movements
  );
  let horasTrabajadas = 0,
    numeroDeEntregas = 0;

  movements.map((movement) => {
    horasTrabajadas += movement.numberHours;
    numeroDeEntregas += movement.numberDeliveries;
  });

  let horas = horasLaborales * diasSemanales * semanasPorMes;
  const horasExtras = horasTrabajadas > horas ? horasTrabajadas - horas : 0;
  const horasFaltantes = horasTrabajadas < horas ? horas - horasTrabajadas : 0;

  let salarioMensual = sueldoBase * horasTrabajadas;
  salarioMensual += numeroDeEntregas * pagoCEntrega;

  let bono = 0;

  if (body.rol === "chofer") {
    bono = bonoChofer;
  } else if (body.rol === "cargador") {
    bono = bonoCargador;
  }

  if (horasExtras > 0) {
    salarioMensual += bono * horasExtras;
  }

  let isr = salarioMensual * retencionISR;

  if (salarioMensual > 10000) {
    isr += salarioMensual * retencionISRAdicional;
  }

  let vales = salarioMensual * valesDespensa;

  salarioMensual -= isr;
  salarioMensual += vales;

  return {
    month: body.month,
    salarioMensual,
    horasTrabajadas,
    horasExtras,
    horasFaltantes,
    numeroDeEntregas,
  };
};

export default salary;
