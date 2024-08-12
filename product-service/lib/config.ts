import * as dotenv from "dotenv";
import path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export type ConfigProps = {
  UNSPLASH_ACCESS_KEY: string;
};

export const getConfig = (): ConfigProps => ({
  UNSPLASH_ACCESS_KEY: process.env["UNSPLASH_ACCESS_KEY"] || "",
});
