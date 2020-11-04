import * as autoscaling from "@aws-cdk/aws-autoscaling";
import * as codedeploy from "@aws-cdk/aws-codedeploy";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ssm from "@aws-cdk/aws-ssm";
import * as cdk from "@aws-cdk/core";
import AwsCodedeployAutoscalingIAM from "./aws-codedeploy-autoscaling-iam";

interface AwsCodedeployAutoscalingProp {
  /**
   * Physical name of this bucket.
   */
  readonly awsCodedeployAutoscalingIAM: AwsCodedeployAutoscalingIAM;
}

export default class AwsCodedeployAutoscaling extends cdk.Construct {
  private _region: string;

  protected _cfnSSMInstallCodeDeployAgent: ssm.CfnAssociation;

  protected _cfnSSMInstallPHP: ssm.CfnAssociation;

  protected _cfnWaitCondition: cdk.CfnWaitCondition;

  protected _cfnLaunchConfiguration: autoscaling.CfnLaunchConfiguration;

  protected _codedeployVpc: ec2.Vpc;

  protected _cfnAsg: autoscaling.CfnAutoScalingGroup;

  protected _application: codedeploy.ServerApplication;

  protected _cfnDeploymentGroup: codedeploy.CfnDeploymentGroup;

  constructor(
    scope: cdk.Construct,
    id: string,
    props: AwsCodedeployAutoscalingProp
  ) {
    super(scope, id);

    this._region = cdk.Stack.of(scope).region;

    this._cfnSSMInstallCodeDeployAgent = this.createCfnSSMInstallCodeDeployAgent();

    this._cfnSSMInstallPHP = this.createCfnSSMInstallPHPAndWaitCondition();

    this._cfnLaunchConfiguration = this.createCfnLaunchConfiguration(
      props.awsCodedeployAutoscalingIAM.codeDeployEC2InstanceProfile
        .instanceProfileName
    );

    this._codedeployVpc = this.createCodedeployVpc();

    this._cfnAsg = this.createCfnAsg(
      this._cfnLaunchConfiguration.launchConfigurationName,
      this._codedeployVpc
    );

    this.attachUserDataForCfnLaunchConfiguration(this._cfnAsg.logicalId);

    this._application = this.createApplication();

    this._cfnDeploymentGroup = this.createDeploymentGroup(
      this._application.applicationName,
      props.awsCodedeployAutoscalingIAM.codeDeployServiceRole.roleArn,
      <string>this._cfnAsg.autoScalingGroupName
    );

    /**
     * order of execution
     */
    this._cfnAsg.addDependsOn(this._cfnLaunchConfiguration);
    this._cfnSSMInstallPHP.addDependsOn(this._cfnAsg);
    this._cfnSSMInstallCodeDeployAgent.addDependsOn(this._cfnWaitCondition);
    this._cfnDeploymentGroup.addDependsOn(this._cfnAsg);
    this._cfnSSMInstallCodeDeployAgent.addDependsOn(this._cfnSSMInstallPHP);
  }

  protected createCfnSSMInstallCodeDeployAgent(): ssm.CfnAssociation {
    return new ssm.CfnAssociation(this, "ASG-SSM-CodeDeployAgent", {
      name: "AWS-ConfigureAWSPackage",
      targets: [{ key: "tag:Name", values: ["CodeDeployDemo"] }],
      parameters: { action: ["Install"], name: ["AWSCodeDeployAgent"] },
      scheduleExpression: "cron(0 18 ? * SUN *)",
    });
  }

  protected createCfnSSMInstallPHPAndWaitCondition(): ssm.CfnAssociation {
    const waitConditionHandler = new cdk.CfnWaitConditionHandle(
      this,
      "waitConditionHandler"
    );

    this._cfnWaitCondition = new cdk.CfnWaitCondition(this, "waitCondition", {
      handle: waitConditionHandler.ref,
      timeout: "1200",
    });

    const cfnSSMInstallPHP = new ssm.CfnAssociation(this, "ASG-SSM-PHP", {
      name: "AWS-RunShellScript",
      targets: [{ key: "tag:Name", values: ["CodeDeployDemo"] }],
      parameters: {
        commands: [
          "apt -y install dialog apt-utils",
          "apt -y install software-properties-common",
          "add-apt-repository -y ppa:ondrej/php",
          "apt-get update",
          "apt -y install php7.4",
          cdk.Fn.join("", [
            "/opt/aws/bin/cfn-signal -e $? -d 'Install php7.4 completed' -r 'Install php7.4 completed' '",
            waitConditionHandler.ref,
            "'",
          ]),
        ],
      },
    });

    this._cfnWaitCondition.addDependsOn(cfnSSMInstallPHP);

    return cfnSSMInstallPHP;
  }

  protected createCfnLaunchConfiguration(
    iamInstanceProfile: string | undefined
  ): autoscaling.CfnLaunchConfiguration {
    return new autoscaling.CfnLaunchConfiguration(this, "ASG-config", {
      launchConfigurationName: "CodeDeployDemo-AS-Configuration",
      imageId: "ami-02b658ac34935766f",
      instanceType: "t3.micro",
      iamInstanceProfile: iamInstanceProfile,
    });
  }

  protected createCodedeployVpc(): ec2.Vpc {
    return new ec2.Vpc(this, "codedeploy-vpc", {
      cidr: "10.0.0.0/16",
      natGateways: 0,
      maxAzs: 4,
    });
  }

  protected createCfnAsg(
    launchConfigurationName: string | undefined,
    vpc: ec2.Vpc
  ): autoscaling.CfnAutoScalingGroup {
    const cfnAsg = new autoscaling.CfnAutoScalingGroup(this, "ASG", {
      autoScalingGroupName: "ASG-with-codedeploy",
      minSize: "6",
      maxSize: "8",
      launchConfigurationName,
      availabilityZones: cdk.Fn.getAzs(this._region),
      vpcZoneIdentifier: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PUBLIC,
      }).subnetIds,
      tags: [{ key: "Name", value: "CodeDeployDemo", propagateAtLaunch: true }],
    });

    cfnAsg.cfnOptions.creationPolicy = {
      resourceSignal: {
        count: 6,
        timeout: "PT5M",
      },
    };

    return cfnAsg;
  }

  protected attachUserDataForCfnLaunchConfiguration(
    asgResourceId: string
  ): void {
    this._cfnLaunchConfiguration.userData = cdk.Fn.base64(
      cdk.Fn.join("\n", [
        "#!/bin/bash -xe",
        "apt-get update -y",
        "apt-get install -y python-setuptools",
        "mkdir -p /opt/aws/bin",
        "wget https://s3.amazonaws.com/cloudformation-examples/aws-cfn-bootstrap-latest.tar.gz",
        "python -m easy_install --script-dir /opt/aws/bin aws-cfn-bootstrap-latest.tar.gz",
        cdk.Fn.sub(
          "/opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource " +
            asgResourceId +
            " --region ${AWS::Region}"
        ),
      ])
    );
  }

  protected createApplication(): codedeploy.ServerApplication {
    return new codedeploy.ServerApplication(this, "CodeDeployApplication", {
      applicationName: "LumenApp",
    });
  }

  protected createDeploymentGroup(
    applicationName: string,
    serviceRoleArn: string,
    autoScalingGroupName: string
  ): codedeploy.CfnDeploymentGroup {
    return new codedeploy.CfnDeploymentGroup(
      this,
      "CodeDeployDeploymentGroup",
      {
        applicationName,
        serviceRoleArn,
        deploymentConfigName:
          codedeploy.ServerDeploymentConfig.ONE_AT_A_TIME.deploymentConfigName,
        deploymentGroupName: "Master",
        autoScalingGroups: [autoScalingGroupName],
        // deploymentStyle: {
        //   deploymentType: "BLUE_GREEN",
        // },
      }
    );
  }
}
