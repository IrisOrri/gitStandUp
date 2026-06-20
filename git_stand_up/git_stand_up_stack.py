import os
from aws_cdk import (
    Stack,
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_iam as iam,  
    RemovalPolicy,
    aws_apigatewayv2 as apigwv2,
    Duration

)
from aws_cdk.aws_apigatewayv2_integrations import HttpLambdaIntegration
from constructs import Construct

class GitStandUpStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        git_standup_table = dynamodb.Table(
            self, "GitStandupDataTable",
            table_name="GitStandupData",
            partition_key=dynamodb.Attribute(name="user_id", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="record_id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=1,
            write_capacity=1,
            removal_policy=RemovalPolicy.DESTROY
        )

        webhook_worker = _lambda.Function(
            self, "WebhookWorkerFunction",
            runtime=_lambda.Runtime.PYTHON_3_11,
            code=_lambda.Code.from_asset("lambda"),
            handler="webhook_worker.handler",
            timeout=Duration.minutes(1),
            environment={
                "TABLE_NAME": git_standup_table.table_name
            }
        )

        git_standup_table.grant_write_data(webhook_worker)

        webhook_worker.add_to_role_policy(iam.PolicyStatement(
            actions=["bedrock:InvokeModel"],
            resources=["*"]  
        ))

        lambda_integration = HttpLambdaIntegration(
            "WebhookIntegration",
            handler=webhook_worker
        )

        http_api = apigwv2.HttpApi(
            self, "GitStandupWebhookApi",
            default_integration=lambda_integration,
            description="Production-grade lightweight public HTTP API for GitHub webhooks."
        )