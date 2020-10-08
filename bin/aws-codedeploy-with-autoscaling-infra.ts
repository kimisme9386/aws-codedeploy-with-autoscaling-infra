#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import AwsCodedeployWithAutoScalingInfraStack from "../lib/aws-codedeploy-with-autoscaling-infra-stack";
import * as fs from "fs";
import * as yaml from "js-yaml";

const config: any = yaml.safeLoad(
  fs.readFileSync("./configs/config.yaml", "utf8")
);

const app = new cdk.App(config.appProps);

const env = {
  region: app.node.tryGetContext("region") || process.env.CDK_DEFAULT_REGION,
  account: app.node.tryGetContext("account") || process.env.CDK_DEFAULT_ACCOUNT,
};

if (!env.region) {
  env.region = config.stackProps.env.region;
}

new AwsCodedeployWithAutoScalingInfraStack(
  app,
  "AwsCodedeployWithEc2InfraStack",
  {
    env,
  }
);
