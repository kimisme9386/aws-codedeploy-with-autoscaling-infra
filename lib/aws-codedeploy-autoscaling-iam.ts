import * as iam from "@aws-cdk/aws-iam";
import * as cdk from "@aws-cdk/core";

interface AwsCodedeployAutoscalingIAMProp {
  /**
   * Physical name of this bucket.
   */
  readonly codeDeployBucketName: string;
}

export default class AwsCodedeployAutoscalingIAM extends cdk.Construct {
  private _region: string;

  private _codeDeployBucketName: string;

  /**
   * For CodeDeploy DeploymentGroup
   */
  private _codeDeployServiceRole: iam.Role;

  /**s
   * For Autoscaling EC2
   */
  private _codeDeployEC2Role: iam.Role;

  /**
   * For Autoscaling EC2
   */
  private _codeDeployEC2InstanceProfile: iam.CfnInstanceProfile;

  /**
   * For CodeDeploy App (CodeDeploy Deployments、application revisions and so on...)
   */
  private _travisCICodeDeployAppUser: iam.User;

  constructor(
    scope: cdk.Construct,
    id: string,
    props: AwsCodedeployAutoscalingIAMProp
  ) {
    super(scope, id);

    this._region = cdk.Stack.of(scope).region;

    this._codeDeployBucketName = props.codeDeployBucketName;

    this._codeDeployServiceRole = this.createCodeDeployServiceRole();

    this._codeDeployEC2Role = this.createCodeDeployEC2Role();

    this._codeDeployEC2InstanceProfile = this.createCodeDeployEC2InstanceProfile(
      this._codeDeployEC2Role
    );

    new cdk.CfnOutput(this, "TravisCIUserCodedeployInfra", {
      value: this._travisCICodeDeployInfraUser.userName,
    });

    this._travisCICodeDeployAppUser = this.createTravisCICodeDeployAppUser();

    new cdk.CfnOutput(this, "TravisCIUserCodedeployApp", {
      value: this._travisCICodeDeployAppUser.userName,
    });
  }

  protected createCodeDeployServiceRole(): iam.Role {
    return new iam.Role(this, "CodeDeployServiceRole", {
      roleName: "CodeDeployServiceRole",
      assumedBy: new iam.ServicePrincipal(
        `codedeploy.${this._region}.amazonaws.com`
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSCodeDeployRole"
        ),
      ],
      inlinePolicies: {
        "auto-scaling-group-with-launch-template": new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["ec2:RunInstances", "ec2:CreateTags", "iam:PassRole"],
              resources: ["*"],
            }),
          ],
        }),
      },
    });
  }

  protected createCodeDeployEC2Role(): iam.Role {
    return new iam.Role(this, "CodeDeploy-EC2", {
      roleName: "CodeDeploy-EC2",
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonSSMManagedInstanceCore"
        ),
      ],
      inlinePolicies: {
        "CodeDeploy-EC2-Permissions": new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["s3:Get*", "s3:List*"],
              resources: [
                `arn:aws:s3:::aws-codedeploy-${this._region}/*`,
                `arn:aws:s3:::${this._codeDeployBucketName}/*`,
              ],
            }),
          ],
        }),
      },
    });
  }

  protected createCodeDeployEC2InstanceProfile(
    assignedRole: iam.Role
  ): iam.CfnInstanceProfile {
    return new iam.CfnInstanceProfile(this, "CodeDeploy-EC2-Instance-Profile", {
      roles: [assignedRole.roleName],
      instanceProfileName: "CodeDeploy-EC2-Instance-Profile",
    });
  }

  protected createTravisCICodeDeployAppUser(): iam.User {
    const user = new iam.User(this, "TravisCIUser-Codedeploy-App", {
      userName: "TravisCiUser-Codedeploy-App",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSCodeDeployDeployerAccess"
        ),
      ],
    });

    user.attachInlinePolicy(
      new iam.Policy(this, "PushS3BucketForCodeDeploy", {
        policyName: "PushS3BucketForCodeDeploy",
        statements: [
          new iam.PolicyStatement({
            actions: ["s3:PutObject"],
            resources: [`arn:aws:s3:::${this._codeDeployBucketName}/*`],
          }),
        ],
      })
    );

    return user;
  }

  public get codeDeployServiceRole(): iam.Role {
    return this._codeDeployServiceRole;
  }

  public get codeDeployEC2Role(): iam.Role {
    return this._codeDeployEC2Role;
  }

  public get codeDeployEC2InstanceProfile(): iam.CfnInstanceProfile {
    return this._codeDeployEC2InstanceProfile;
  }

  public get travisCICodeDeployAppUser(): iam.User {
    return this._travisCICodeDeployAppUser;
  }
}
