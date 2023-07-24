import chalk from "chalk";
import mongoose from "mongoose";

export default () => {
  mongoose.pluralize(null);
  mongoose.connect(process.env.MONGO_URI);
  mongoose.set("debug", process.env.debug ? process.env.debug : true);
  const db = mongoose.connection;
  db.on("error", () => {
    console.log(chalk.red("[admin_system] Error connecting with mongo"));
  });
  db.once("open", () => {
    console.log(chalk.green("[admin_system] Connection with MongoDB"));
  });
  return db;
};
