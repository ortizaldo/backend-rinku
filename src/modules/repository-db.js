import { model, Schema, Types } from "mongoose";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import _ from "underscore";

import {
  deleteBody,
  findDuplicatedCustom,
  findDuplicatedOnUpdated,
} from "modules";

const db = {};

db.create = async (
  req,
  options,
  modelClass,
  filterOptions = { populate: null }
) => {
  let fields = [];

  if (hasHooks(options, "post", "before")) {
    // eslint-disable-next-line
    var { req, res } = {
      ...(await executeHook(options, "post", "before", { req, res })),
    };
  }

  if (_.has(req.body, "fieldsDuplicated")) {
    fields = req.body.fieldsDuplicated;
  }

  const params = req.body;

  if (req.hashPassword) {
    params.hashedPassword = await bcrypt.hash(req.body.password, 10);
  }

  if (fields.length) {
    const duplicated = await findDuplicatedCustom(modelClass, fields, req.body);

    if (duplicated) {
      if (_.has(options, "alertDuplicated")) {
        throw global.constants.response[options.alertDuplicated];
      } else {
        throw global.constants.response.recordDuplicated;
      }
    }
  }

  if (req.user && req.user._id) {
    params.createdBy = req.user._id;
    params.updatedBy = req.user._id;
    params.createdAt = new Date();
  }

  const modelData = new modelClass(params);
  let data = await modelData.save();

  const query = modelClass.findById(data._id);

  if (filterOptions && filterOptions.populate) {
    _.each(filterOptions.populate, function (row) {
      query.populate(row);
    });
  }

  data = await query;

  if (hasHooks(options, "post", "after")) {
    const { req, res } = {
      ...(await executeHook(options, "post", "after", {
        req,
        res,
        doc: instance,
      })),
    };
  }
  return data;
};

db.createMany = async (req, options, modelClass) => {
  let fields = [];
  if (hasHooks(options, "post", "before")) {
    // eslint-disable-next-line
    var { req, res } = {
      ...(await executeHook(options, "post", "before", { req, res })),
    };
  }

  if (_.has(req.body, "fieldsDuplicated")) {
    fields = req.body.fieldsDuplicated;
  }

  const params = req.body;

  if (fields.length) {
    const duplicated = await findDuplicatedCustom(modelClass, fields, req.body);

    if (duplicated) {
      throw global.constants.response.recordDuplicated;
    }
  }

  let result;
  if (!_.isArray(params)) {
    if (req.user && req.user._id) {
      params.createdBy = req.user._id;
      params.updatedBy = req.user._id;
      req.body.createdAt = new Date();
    }
    result = await modelClass.create(params);
  } else {
    result = [];
    // eslint-disable-next-line
    for await (const mo of params) {
      const instance = await modelClass.create(mo);
      result.push(instance);
    }
  }

  if (hasHooks(options, "post", "after")) {
    // eslint-disable-next-line
    var { req, res } = {
      ...(await executeHook(options, "post", "after", {
        req,
        res,
        doc: result,
      })),
    };
  }

  return result;
};

db.updateMany = async (req, options, modelClass) => {
  const { id: pk } = req.params;

  if (hasHooks(options, "patch", "before")) {
    var { req, res } = {
      ...(await executeHook(options, "patch", "before", { req, res })),
    };
  }

  let items = Array.isArray(req.query.items)
    ? req.query.items
    : [req.query.items];

  if (pk !== undefined) {
    items = [pk];
  }

  const instance = await modelClass
    .updateMany(
      {
        $and: [
          {
            _id: {
              $in: items,
            },
          },
        ],
      },
      req.body
    )
    .lean();

  if (!instance) {
    throw global.constants.response.recordNotFound;
  }

  const updatedResult = await modelClass.find({ _id: { $in: items } });

  if (hasHooks(options, "patch", "after")) {
    var { req, res } = {
      ...(await executeHook(options, "patch", "after", {
        req,
        res,
        doc: updatedResult,
      })),
    };
  }

  return instance;
};

db.get = async (req, options, modelClass) => {
  const pk = _.has(req.params, "id") ? req.params.id : null;
  let filters = _.has(req.query, "filters")
    ? JSON.parse(req.query.filters)
    : {};
  const nin = _.has(req.query, "nin") ? JSON.parse(req.query.nin) : {};

  if (_.has(nin, "_id")) {
    const ids = [];

    _.each(nin._id.$nin, (row) => {
      ids.push(new Types.ObjectId(row));
    });

    nin._id.$nin = ids;

    filters = { ...filters, ...nin };
  }

  const filtersId = _.has(req.query, "filtersId")
    ? JSON.parse(req.query.filtersId)
    : {};

  Object.keys(filtersId).map((key) => {
    const id = filtersId[key].value;
    filtersId[key] = new Types.ObjectId(id);
  });

  filters = { ...filters, ...filtersId };

  if (hasHooks(options, "get", "before")) {
    // eslint-disable-next-line
    var { req, res } = {
      ...(await executeHook(options, "get", "before", { req, res })),
    };
  }

  if (_.has(req.query, "regexp")) {
    const regexp = JSON.parse(req.query.regexp);
    filters = { ...filters, ...regexp };
  }

  const populate = _.has(req.query, "populate")
    ? JSON.parse(req.query.populate)
    : [];

  let pipelines = iteratorLookup(req, modelClass, populate);

  const filtersIncludedId = _.has(req.query, "filtersIncludedId")
    ? JSON.parse(req.query.filtersIncludedId)
    : null;
  if (filtersIncludedId) {
    const query = {
      $in: [
        "$_id",
        filtersIncludedId.map((item) => new Types.ObjectId(item)()),
      ],
    };
    pipelines.push({ $match: { $expr: query } });
  }

  const sort = _.has(req.query, "sort") ? JSON.parse(req.query.sort) : null;
  if (sort) {
    const operatorSort = {};
    Object.keys(sort).forEach((k) => {
      operatorSort[k] = sort[k] === "asc" ? 1 : -1;
    });
    pipelines = [
      ...pipelines,
      ...[
        {
          $sort: operatorSort,
        },
      ],
    ];
  }
  const select = _.has(req.query, "select") ? JSON.parse(req.query.select) : [];

  if (select.length > 0) {
    const projects = {
      $project: {
        ...Object.assign(
          {},
          ...select.map((item) => ({
            [item]: 1,
          }))
        ),
        ...{
          deleted: 1,
        },
      },
    };
    pipelines = [...pipelines, ...[projects]];
  }

  pipelines = [
    ...[
      {
        $match: filters,
      },
      ...pipelines,
    ],
  ];

  let result;
  if (!pk) {
    const limit = _.has(req.query, "limit") ? Number(req.query.limit) : 0;
    const skip = _.has(req.query, "skip") ? Number(req.query.skip) : 0;
    if (skip >= 0) {
      pipelines = [
        ...pipelines,
        ...[
          {
            $skip: skip,
          },
        ],
      ];
    }
    if (limit > 0) {
      pipelines = [
        ...pipelines,
        ...[
          {
            $limit: limit,
          },
        ],
      ];
    }
    result = await modelClass.aggregate(pipelines);
  } else {
    result = await modelClass
      .findById(pk)
      .collation({
        locale: "en",
      })
      .populate(populate)
      .sort(sort)
      .select(select);
  }

  // var afterhook;
  if (options) {
    if (hasHooks(options, "get", "after")) {
      await executeHook(options, "get", "after", { req, res, result });
    }
  }
  const response = {
    data: result,
  };

  if (
    _.has(req.query, "total") ||
    _.has(req.query, "pageSize") ||
    _.has(req.query, "limit")
  ) {
    response.total = await modelClass.countDocuments(filters);
  }
  return response;
};

db.edit = async (req, options, modelClass) => {
  const { body } = req;
  if (hasHooks(options, "patch", "before")) {
    // eslint-disable-next-line
    var { req, res } = {
      ...(await executeHook(options, "patch", "before", { req, res })),
    };
  }

  let fields = [];

  if (_.has(req.body.data, "fieldsDuplicated")) {
    fields = req.body.data.fieldsDuplicated;
  }

  if (fields.length) {
    const duplicated = await findDuplicatedOnUpdated(
      modelClass,
      fields,
      req.body.data,
      req.params.id
    );

    if (duplicated) {
      if (_.has(options, "alertDuplicated")) {
        throw global.constants.response[options.alertDuplicated];
      } else {
        throw global.constants.response.recordDuplicated;
      }
    }
  }

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

  if (hasHooks(options, "patch", "after")) {
    // eslint-disable-next-line
    var { req, res } = {
      ...(await executeHook(options, "patch", "after", {
        req,
        res,
        doc: instance,
      })),
    };
  }

  return instance;
};

db.delete = async (req, options, modelClass) => {
  const { id: pk } = req.params;

  const filters = "filters" in req.query ? JSON.parse(req.query.filters) : {};

  if (hasHooks(options, "delete", "before")) {
    // eslint-disable-next-line
    var { req, res } = {
      ...(await executeHook(options, "delete", "before", { req, res })),
    };
  }

  let items = Array.isArray(req.query.items)
    ? req.query.items
    : [req.query.items];

  if (pk !== undefined) {
    items = [pk];
    if (_.has(options, "moduleRelated")) {
      const doc = await getRelateddocs(
        req,
        pk,
        options.moduleRelated,
        options.fieldRelated
      );
      if (doc.length === 2) {
        if (doc[1].length > 0) {
          throw global.constants.response.recordUsed;
        }
      }
    }
  }

  if (pk === undefined) {
    if (_.has(options, "moduleRelated")) {
      const doc = await getRelateddocs(
        req,
        items,
        options.moduleRelated,
        options.fieldRelated
      );
      if (doc.length > 0) {
        throw global.constants.response.recordUsed;
      }
    }
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

  if (hasHooks(options, "delete", "after")) {
    var { req, res } = {
      ...(await executeHook(options, "delete", "after", { req, res })),
    };
  }
  return instance;
};

const getRelateddocs = (req, uid, model = null, fieldRelated = null) =>
  new Promise(async (resolve, reject) => {
    try {
      try {
        // const module = {};
        const moduleDel = await req.model(model).find({
          [fieldRelated]: {
            $in: uid,
          },
          deleted: false,
        });
        if (moduleDel) {
          if (moduleDel.length > 0) {
            arrModule.push(moduleDel);
          }
        }

        resolve(arrModule);
      } catch (err) {
        reject(err);
      }
    } catch (err) {
      reject(err);
    }
  });

function executeHook(opts, hookMethod, hookName, params) {
  return of(params)
    .pipe(...opts.hooks[hookMethod][hookName])
    .toPromise();
}

function hasHooks(opts, hookMethod, hookName) {
  // eslint-disable-next-line max-len
  return (
    opts &&
    opts.hooks &&
    opts.hooks[hookMethod] &&
    opts.hooks[hookMethod][hookName] instanceof Array &&
    opts.hooks[hookMethod][hookName].length
  );
}

function buildVirtualLookup(req, modelClass, item, referenceVirtualPath) {
  const model = req.model(referenceVirtualPath.options.ref);
  let params = {
    from: model.collection.name,
    as: item.path,
  };
  if (Array.isArray(item.populate)) {
    // eslint-disable-next-line
    const childPipelines = iteratorLookup(req, model, item.populate);
    params = {
      ...params,
      ...{
        let: {
          foreignId: `$${referenceVirtualPath.options.foreignField}`,
        },
        pipeline: [
          ...[
            {
              $match: {
                $expr: {
                  $eq: [
                    `$${referenceVirtualPath.options.localField}`,
                    "$$foreignId",
                  ],
                },
              },
            },
          ],
          ...childPipelines,
        ],
      },
    };
  } else {
    params = {
      ...params,
      ...{
        localField: referenceVirtualPath.options.localField,
        foreignField: referenceVirtualPath.options.foreignField,
      },
    };
  }
  return {
    $lookup: params,
  };
}

function buildLookup(req, modelClass, item) {
  const referencePath = modelClass.schema.path(item.path);
  const referenceOptions = referencePath.options;
  const reference =
    referencePath.instance === "Array"
      ? referenceOptions.type[0].ref
      : referenceOptions.ref;
  const model = req.model(reference);
  let params = {
    from: model.collection.name,
    as: item.path,
  };
  if (Array.isArray(item.populate)) {
    // eslint-disable-next-line
    const childPipelines = iteratorLookup(req, model, item.populate);
    params = {
      ...params,
      ...{
        let: {
          foreignId: `$${item.path}`,
        },
        pipeline: [
          ...[
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$foreignId"],
                },
              },
            },
          ],
          ...childPipelines,
        ],
      },
    };
  } else {
    params = {
      ...params,
      ...{
        localField: item.path,
        foreignField: "_id",
      },
    };
  }
  return {
    $lookup: params,
  };
}

// to enable deep level flatten use recursion with reduce and concat
function iteratorLookup(req, modelClass, array) {
  const result = [];
  array.forEach((a) => {
    const referenceVirtualPath = modelClass.schema.virtualpath(a.path);
    const referencePath = modelClass.schema.path(a.path);
    let lookup = null;
    if (referenceVirtualPath) {
      lookup = buildVirtualLookup(req, modelClass, a, referenceVirtualPath);
    } else {
      lookup = buildLookup(req, modelClass, a);
      result.push(lookup);
      if (referencePath.instance === "ObjectId") {
        result.push({
          $unwind: {
            path: `$${a.path}`,
            preserveNullAndEmptyArrays: true,
          },
        });
      }
    }
  });
  return result;
}

export default db;
