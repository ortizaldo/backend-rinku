import { Router } from "express";
import { resError, db, salary } from "modules";
import _ from "underscore";

/**
 * Creates a REST router for the specified model class.
 *
 * @param {string} modelClassname - The name of the model class.
 * @param {object} options - (optional) Additional options for the router.
 * @param {boolean} hashPassword - (optional) Whether to hash the password.
 * @return {object} The REST router for the model class.
 */
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

  /**
   * Asynchronously handles the HTTP POST request.
   *
   * @param {Object} req - the request object
   * @param {Object} res - the response object
   * @return {Promise} - a promise that resolves with the response data
   */
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

  /**
   * Handles the salary request.
   *
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @return {Promise<void>} - Returns a promise that resolves when the salary request is handled.
   */
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

  /**
   * Handles the PATCH request.
   *
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @return {Promise<void>} - A Promise that resolves with no value.
   */
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

  /**
   * Deletes a record from the database.
   *
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @return {Promise} A promise that resolves to the deleted instance.
   */
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
