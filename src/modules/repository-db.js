import { model, Schema, Types } from "mongoose";
import { ObjectId } from "mongodb";
import _ from "underscore";

import { deleteBody } from "modules";

const db = {};

/**
 * Creates a new document in the database.
 *
 * @param {Object} req - The request object.
 * @param {Class} modelClass - The class representing the model.
 * @param {Object} [filterOptions={ populate: null }] - The filter options for populating fields.
 * @return {Promise} A promise that resolves to the created document.
 */
db.create = async (req, modelClass, filterOptions = { populate: null }) => {
  const params = req.body;

  params.createdAt = new Date();

  const modelData = new modelClass(params);
  let data = await modelData.save();

  const query = modelClass.findById(data._id);

  if (filterOptions && filterOptions.populate) {
    _.each(filterOptions.populate, function (row) {
      query.populate(row);
    });
  }

  data = await query;
  return data;
};

/**
 * Retrieves all data from the database based on the given payload and model.
 *
 * @param {Object} payload - The payload object containing query details.
 * @param {Object} model - The model object representing the database collection.
 * @return {Promise} A promise that resolves to the retrieved data.
 */
db.getAll = async (payload, model) => {
  const { populate } = payload.query;
  let { filter } = payload.query;
  const { filtersId } = payload.query;
  const { sort } = payload.query;

  if (filtersId) {
    Object.keys(filtersId).map((key) => {
      const id = filtersId[key].value;
      filtersId[key] = new Types.ObjectId(id);
    });
  }

  if (sort) {
    Object.keys(sort).map((key) => {
      const _sort = filtersId[key];
      sort[key] = _sort === "asc" ? 1 : -1;
    });
  }

  filter = { ...filter, ...filtersId };
  const _query = model.find(filter ? filter : null);

  _.each(populate, function (row) {
    _query.populate(row);
  });

  _query.sort = sort ? sort : { createdAt: -1 };
  const data = await _query;

  return data;
};

/**
 * Retrieves data from the database using the given payload and model.
 *
 * @param {object} payload - The payload containing the id.
 * @param {object} model - The model used to retrieve the data.
 * @return {Promise<object>} The retrieved data.
 */
db.get = async (payload, model) => {
  const id = payload.id;
  const data = await model.findById(id);
  return data;
};

/**
 * Edits a document in the database.
 *
 * @param {Object} req - the request object
 * @param {Object} modelClass - the model class representing the document
 * @return {Object} - the updated document
 */
db.edit = async (req, modelClass) => {
  const { body } = req;
  const { id } = req.params;

  if (!id) {
    throw global.constants.response.recordNotFound;
  }
  const _id = new Types.ObjectId(id);
  let instance = await modelClass
    .findOneAndUpdate(
      {
        _id,
      },
      { ...body, _id },
      {
        new: true,
      }
    )
    .lean();
  if (!instance) {
    throw global.constants.response.recordNotFound;
  }
  let populate = [];

  if (_.has(req.body, "populateFields")) {
    populate = req.body.populateFields;
    instance = await modelClass
      .findById(instance._id)
      .populate(populate)
      .lean();
  }

  return instance;
};

/**
 * Deletes a record from the database based on the provided ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} modelClass - The class of the model to delete from.
 * @return {Object} The deleted instance from the database.
 */
db.deleteById = async (req, modelClass) => {
  const { id } = req.params;

  if (!id) {
    throw global.constants.response.recordNotFound;
  }

  let instance;

  instance = await modelClass.deleteOne({
    _id: new Types.ObjectId(id),
  });

  if (!instance) {
    throw global.constants.response.recordNotFound;
  }
  return instance;
};

export default db;
