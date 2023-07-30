import { Router } from "express";
import { resError, db, salary } from "modules";
import _ from "underscore";

function RestRouter(modelClassname, options = null, hashPassword = false) {
  const router = Router();
  async function handlerGet(req, res) {
    try {
      const response = await db.getAll(req, modelClassname);

      res.status(200).json(response);
    } catch (err) {
      resError(res, err);
    }
  }

  async function handlerPost(req, res) {
    try {
      const instance = await db.create(
        req,
        modelClassname,
        req.body.filterOptions
          ? {
              populate: req.body.populateFields,
            }
          : null
      );

      res.status(200).json({
        data: instance,
      });
    } catch (err) {
      resError(res, err);
    }
  }

  async function handlerSalary(req, res) {
    try {
      const instance = await salary.getSalary(
        req,
        modelClassname,
        req.body.filterOptions
          ? {
              populate: req.body.populateFields,
            }
          : null
      );

      res.status(200).json({
        data: instance,
      });
    } catch (err) {
      resError(res, err);
    }
  }

  async function handlerPatch(req, res) {
    try {
      const instance = await db.edit(req, modelClassname);

      res.status(200).json({
        data: instance,
      });
    } catch (err) {
      resError(res, err);
    }
  }

  async function handlerDelete(req, res) {
    try {
      const instance = await db.deleteById(req, modelClassname);
      res.status(200).json({
        data: instance,
      });
    } catch (err) {
      resError(res, err);
    }
  }

  router.post("/new", handlerPost);
  router.post("/get-salary", handlerSalary);
  router.get("/:id?", handlerGet);
  router.patch("/:id", handlerPatch);
  router.put("/:id", handlerPatch);
  router.delete("/:id?", handlerDelete);
  return router;
}

export default RestRouter;
