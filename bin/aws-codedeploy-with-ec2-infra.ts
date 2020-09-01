#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsCodedeployWithEc2InfraStack } from '../lib/aws-codedeploy-with-ec2-infra-stack';

const app = new cdk.App();
new AwsCodedeployWithEc2InfraStack(app, 'AwsCodedeployWithEc2InfraStack');
