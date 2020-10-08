import * as cdk from "@aws-cdk/core";
import * as autoscaling from "@aws-cdk/aws-autoscaling";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ssm from "@aws-cdk/aws-ssm";
import * as codedeploy from "@aws-cdk/aws-codedeploy";
import * as s3 from "@aws-cdk/aws-s3";

export default class AwsCodedeployWithAutoScalingInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cfnSSMInstallCodeDeployAgent = new ssm.CfnAssociation(
      this,
      "ASG-SSM-CodeDeployAgent",
      {
        name: "AWS-ConfigureAWSPackage",
        targets: [{ key: "tag:Name", values: ["CodeDeployDemo"] }],
        parameters: { action: ["Install"], name: ["AWSCodeDeployAgent"] },
        scheduleExpression: "cron(0 18 ? * SUN *)",
      }
    );

    const cfnSSMInstallPHP = new ssm.CfnAssociation(this, "ASG-SSM-PHP", {
      name: "AWS-RunShellScript",
      targets: [{ key: "tag:Name", values: ["CodeDeployDemo"] }],
      parameters: {
        commands: [
          "add-apt-repository ppa:ondrej/php",
          "apt-get update",
          "apt -y install php7.4",
        ],
      },
    });

    const cfnLaunchConfiguration = new autoscaling.CfnLaunchConfiguration(
      this,
      "ASG-config",
      {
        launchConfigurationName: "CodeDeployDemo-AS-Configuration",
        imageId: "ami-01c36f3329957b16a",
        instanceType: "t3.micro",
        iamInstanceProfile: "CodeDeployDemo-EC2-Instance-Profile",
      }
    );

    const codedeployVpc = new ec2.Vpc(this, "codedeploy-vpc", {
      cidr: "10.0.0.0/16",
      natGateways: 0,
      maxAzs: 4,
    });

    const cfnAsg = new autoscaling.CfnAutoScalingGroup(this, "ASG", {
      autoScalingGroupName: "ASG-with-codedeploy",
      minSize: "6",
      maxSize: "8",
      launchConfigurationName: cfnLaunchConfiguration.launchConfigurationName,
      availabilityZones: cdk.Fn.getAzs(this.region),
      vpcZoneIdentifier: codedeployVpc.selectSubnets({
        subnetType: ec2.SubnetType.PUBLIC,
      }).subnetIds,
      tags: [{ key: "Name", value: "CodeDeployDemo", propagateAtLaunch: true }],
    });

    cfnAsg.addDependsOn(cfnSSMInstallCodeDeployAgent);
    cfnAsg.addDependsOn(cfnLaunchConfiguration);
    cfnAsg.addDependsOn(cfnSSMInstallPHP);

    const application = new codedeploy.ServerApplication(
      this,
      "CodeDeployApplication",
      {
        applicationName: "LumenApp",
      }
    );

    const deploymentGroup = new codedeploy.CfnDeploymentGroup(
      this,
      "CodeDeployDeploymentGroup",
      {
        applicationName: application.applicationName,
        serviceRoleArn: "arn:aws:iam::482631629698:role/CodeDeployServiceRole",
        deploymentConfigName:
          codedeploy.ServerDeploymentConfig.ONE_AT_A_TIME.deploymentConfigName,
        deploymentGroupName: "Master",
        autoScalingGroups: [<string>cfnAsg.autoScalingGroupName],
        // deploymentStyle: {
        //   deploymentType: "BLUE_GREEN",
        // },
      }
    );

    deploymentGroup.addDependsOn(cfnAsg);

    const bucket = new s3.Bucket(this, "CodeDeploymentBucket");

    new cdk.CfnOutput(this, "DeploymentBucketName", {
      value: bucket.bucketName,
    });
  }
}
``;
