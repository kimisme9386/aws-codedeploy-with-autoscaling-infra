import '@aws-cdk/assert/jest';
import * as s3 from '@aws-cdk/aws-s3';
import { Stack } from '@aws-cdk/core';
import AwsCodedeployAutoscalingIAM from '../lib/aws-codedeploy-autoscaling-iam';

test('AWS CodeDeploy Autoscaling IAM Role and User', () => {
  const stack = new Stack(undefined, undefined, {
    env: { region: 'ap-northeast-1' },
  });
  const bucket = new s3.Bucket(stack, 'CodeDeploymentBucket');

  new AwsCodedeployAutoscalingIAM(stack, 'AwsCodedeployAutoscalingIAM', {
    codeDeployBucketName: bucket.bucketName,
  });

  expect(stack).toHaveResource('AWS::S3::Bucket');
  expect(stack).toHaveResource('AWS::IAM::Role', {
    RoleName: 'CodeDeployServiceRole',
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'codedeploy.ap-northeast-1.amazonaws.com',
          },
        },
      ],
      Version: '2012-10-17',
    },
    ManagedPolicyArns: [
      {
        'Fn::Join': [
          '',
          [
            'arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':iam::aws:policy/service-role/AWSCodeDeployRole',
          ],
        ],
      },
    ],
    Policies: [
      {
        PolicyDocument: {
          Statement: [
            {
              Action: ['ec2:RunInstances', 'ec2:CreateTags', 'iam:PassRole'],
              Effect: 'Allow',
              Resource: '*',
            },
          ],
          Version: '2012-10-17',
        },
        PolicyName: 'auto-scaling-group-with-launch-template',
      },
    ],
  });
  expect(stack).toHaveResource('AWS::IAM::Role', {
    RoleName: 'CodeDeploy-EC2',
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com',
          },
        },
      ],
      Version: '2012-10-17',
    },
    Policies: [
      {
        PolicyDocument: {
          Statement: [
            {
              Action: ['s3:Get*', 's3:List*'],
              Effect: 'Allow',
              Resource: [
                'arn:aws:s3:::aws-codedeploy-ap-northeast-1/*',
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:aws:s3:::',
                      {
                        Ref: 'CodeDeploymentBucket072AA3C8',
                      },
                      '/*',
                    ],
                  ],
                },
              ],
            },
          ],
          Version: '2012-10-17',
        },
        PolicyName: 'CodeDeploy-EC2-Permissions',
      },
    ],
  });
  expect(stack).toHaveResource('AWS::IAM::InstanceProfile', {
    Roles: [
      {
        Ref: 'AwsCodedeployAutoscalingIAMCodeDeployEC2CC62C180',
      },
    ],
    InstanceProfileName: 'CodeDeploy-EC2-Instance-Profile',
  });
  expect(stack).toHaveResource('AWS::IAM::User', {
    UserName: 'TravisCiUser-Codedeploy-App',
    ManagedPolicyArns: [
      {
        'Fn::Join': [
          '',
          [
            'arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':iam::aws:policy/AWSCodeDeployDeployerAccess',
          ],
        ],
      },
    ],
  });
});
