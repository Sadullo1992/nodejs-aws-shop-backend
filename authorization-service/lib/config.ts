import * as dotenv from "dotenv";
import path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export type ConfigProps = {
  LOGIN: string;
  PASSWORD: string;
};

const login = "Sadullo1992";

export const getConfig = (): ConfigProps => ({
  LOGIN: login,
  PASSWORD: process.env[login] || "",
});
