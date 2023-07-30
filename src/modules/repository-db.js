import { model, Schema, Types } from "mongoose";
import { ObjectId } from "mongodb";
import _ from "underscore";

import { deleteBody } from "modules";

const db = {};

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

db.get = async (payload, model) => {
  const id = payload.id;
  const data = await model.findById(id);
  return data;
};

db.edit = async (req, modelClass) => {
  const { body } = req;

  let instance = await modelClass
    .findOneAndUpdate(
      {
        _id: new Types.ObjectId(req.params.id),
      },
      body,
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
