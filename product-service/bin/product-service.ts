#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ProductServiceStack } from "../lib/product-service-stack";
import { getConfig } from "../lib/config";

const config = getConfig();

const app = new cdk.App();
new ProductServiceStack(app, "ProductServiceStack", {
  config,
});
