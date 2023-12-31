import {
  findDuplicated,
  findDuplicatedOnUpdated,
  findDuplicatedCustom,
} from "./find-duplicated";
import mongooseCon from "./mongo-connection";
import resError from "./res-error";
import { deleteBody } from "./utilities";
import db from "./repository-db";
import salary from "./repository-salary";

export {
  findDuplicated,
  findDuplicatedOnUpdated,
  findDuplicatedCustom,
  mongooseCon,
  resError,
  deleteBody,
  db,
  salary,
};
