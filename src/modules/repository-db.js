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
  const query = model.find(payload.filters ? payload.filters : null);

  _.each(payload.populate, function (row) {
    query.populate(row);
  });

  query.sort = payload.sort ? payload.sort : { createdAt: -1 };

  const data = await query;

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
        deleted: false,
      },
      body.data,
      {
        new: true,
      }
    )
    .lean();
  if (!instance) {
    throw global.constants.response.recordNotFound;
  }
  let populate = [];

  if (_.has(req.body.data, "populateFields")) {
    populate = req.body.populateFields;
    instance = await modelClass
      .findById(instance._id)
      .populate(populate)
      .lean();
  }

  return instance;
};

db.delete = async (req, modelClass) => {
  const { id: pk } = req.params;

  const filters = "filters" in req.query ? JSON.parse(req.query.filters) : {};

  let items = Array.isArray(req.query.items)
    ? req.query.items
    : [req.query.items];

  if (pk !== undefined) {
    items = [pk];
  }

  let instance;

  if (filters.hardDelete) {
    instance = await modelClass.deleteMany({
      _id: {
        $in: items,
      },
    });
  } else {
    instance = await modelClass.updateMany(
      {
        $and: [
          {
            _id: {
              $in: items,
            },
          },
        ],
      },
      deleteBody(req.user ? req.user._id : null, true),
      {
        new: true,
      }
    );
  }

  if (!instance) {
    throw global.constants.response.recordNotFound;
  }
  return instance;
};

export default db;
