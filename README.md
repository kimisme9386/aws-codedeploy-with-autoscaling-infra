[![Build Status](https://travis-ci.com/kimisme9386/aws-codedeploy-with-autoscaling-infra.svg?branch=master)](https://travis-ci.com/kimisme9386/aws-codedeploy-with-autoscaling-infra)

### [AWS CodeDeploy](https://aws.amazon.com/tw/codedeploy/) for [AWS Auto Scaling](https://aws.amazon.com/tw/autoscaling/) within [AWS CDK](https://github.com/aws/aws-cdk) to build AWS infrastructure.

The repository is AWS CodeDeploy infrastructure as code, [the other repository](https://github.com/kimisme9386/aws-codedeploy-with-autoscaling-app) is application revisions for CodeDeploy. They are a couple.

The application revisions is [php lumen project](https://lumen.laravel.com/). If you want to use others, feel free to clone it and modify.

## Preparation

- AWS account
- Travis ci account
- [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/home.html)

> if you want to build on your local environment, it's necessary.

## Build on Travis CI

#### Create IAM user for creating AWS infrastructure

The IAM user must have enough permissions to create IAM user, IAM role, autoscaling group, codedeploy application, codedeploy deployment group and so on...

Attach `AdministratorAccess` policy to the IAM user is the simplest.

#### Set environment variable of AWS IAM credential on Travis CI dashboard

On Environment Variables section of settings, set environment variable of AWS IAM credential according to previous step.

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_DEFAULT_REGION

#### Check result

- Travis CI build pass or fail
- Cloudformation stack status in the AWS Management Console

## CodeDeploy Deployment

CodeDeploy Deployment (application revisions) refer to [aws-codedeploy-with-autoscaling-app](https://github.com/kimisme9386/aws-codedeploy-with-autoscaling-app) repository

## What is next

[Integrating CodeDeploy with Elastic Load Balancing](https://docs.aws.amazon.com/codedeploy/latest/userguide/integrations-aws-elastic-load-balancing.html)
