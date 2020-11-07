#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import 'source-map-support/register';
import AwsCodedeployWithAutoScalingInfraStack from '../lib/aws-codedeploy-with-autoscaling-infra-stack';

const config: any = yaml.safeLoad(
  fs.readFileSync('./configs/config.yaml', 'utf8')
);

const app = new cdk.App(config.appProps);

const env = {
  region: app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION,
  account: app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT,
};

new AwsCodedeployWithAutoScalingInfraStack(
  app,
  'AwsCodedeployWithAutoScalingInfraStack',
  {
    env,
  }
);
