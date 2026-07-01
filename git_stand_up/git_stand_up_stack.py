import os
from aws_cdk import (
    Stack,
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_iam as iam,  
    RemovalPolicy,
    aws_apigatewayv2 as apigwv2,
    Duration,
    CfnOutput,
    aws_cognito as cognito

)
from aws_cdk.aws_apigatewayv2_authorizers import HttpUserPoolAuthorizer
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

        user_pool = cognito.UserPool(
            self, "GitStandupUserPool",
            user_pool_name="GitStandupUsers",
            self_sign_up_enabled=True, 
            sign_in_aliases=cognito.SignInAliases(email=True), 
            auto_verify=cognito.AutoVerifiedAttrs(email=True), 
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=False
            ),
            removal_policy=RemovalPolicy.DESTROY 
        )

        user_pool_client = cognito.UserPoolClient(
            self, "GitStandupUserPoolClient",
            user_pool=user_pool,
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True 
            )
        )

        CfnOutput(self, "CognitoUserPoolId", value=user_pool.user_pool_id)
        CfnOutput(self, "CognitoAppClientId", value=user_pool_client.user_pool_client_id)

        webhook_worker = _lambda.Function(
            self, "WebhookWorkerFunction",
            runtime=_lambda.Runtime.PYTHON_3_11,
            code=_lambda.Code.from_asset("lambda"),
            handler="webhook_worker.handler",
            timeout=Duration.seconds(10),
            environment={
                "TABLE_NAME": git_standup_table.table_name
            }
        )

        manual_note_worker = _lambda.Function(
            self, "ManualNoteWorkerFunction",
            runtime=_lambda.Runtime.PYTHON_3_11,
            code=_lambda.Code.from_asset("lambda"),
            handler="manual_note_worker.handler",
            timeout=Duration.seconds(30), # Fast database write, doesn't need 1 minute
            environment={
                "TABLE_NAME": git_standup_table.table_name
            }
        )

        generate_standup_worker = _lambda.Function(
            self, "GenerateStandupWorkerFunction",
            runtime=_lambda.Runtime.PYTHON_3_11,
            code=_lambda.Code.from_asset("lambda"),
            handler="generate_standup_worker.handler",
            timeout=Duration.seconds(29), # Keep under API Gateway's 30-second cap
            environment={
                "TABLE_NAME": git_standup_table.table_name
            }
        )
        # IAM Security Policies
        git_standup_table.grant_write_data(webhook_worker)
        git_standup_table.grant_write_data(manual_note_worker)
        git_standup_table.grant_read_data(generate_standup_worker)
        generate_standup_worker.add_to_role_policy(iam.PolicyStatement(
            actions=["bedrock:InvokeModel"],
            resources=["*"]  
        ))


        # API Gateway Integrations
        webhook_integration = HttpLambdaIntegration(
            "WebhookIntegration",
            handler=webhook_worker
        )
        manual_note_integration = HttpLambdaIntegration(
            "ManualNoteIntegration",
            handler=manual_note_worker
        )
        generate_standup_integration = HttpLambdaIntegration(
            "GenerateStandupIntegration",
            handler=generate_standup_worker
        )
        # HTTP API Gateway Setup
        http_api = apigwv2.HttpApi(
            self, "GitStandupWebhookApi",
            description="Production-grade lightweight public HTTP API for Git StandUp app.",
            cors_preflight=apigwv2.CorsPreflightOptions(
            allow_origins=["*"],
            allow_methods=[apigwv2.CorsHttpMethod.POST, apigwv2.CorsHttpMethod.OPTIONS, apigwv2.CorsHttpMethod.GET],
            allow_headers=["Content-Type", "Authorization"]
            )
        )
        authorizer = HttpUserPoolAuthorizer(
            "GitStandupHttpAuthorizer",
            pool=user_pool,
            user_pool_clients=[user_pool_client]
        )
        http_api.add_routes(
            path="/",
            methods=[apigwv2.HttpMethod.POST],
            integration=webhook_integration
        )

        http_api.add_routes(
            path="/notes",
            methods=[apigwv2.HttpMethod.POST],
            integration=manual_note_integration,
            authorizer=authorizer
        )

        http_api.add_routes(
            path="/standup",
            methods=[apigwv2.HttpMethod.GET],
            integration=generate_standup_integration,
            authorizer=authorizer
        )

        # Printing API Endpoint to terminal
        CfnOutput(
            self, "WebhookApiEndpoint",
            value=http_api.url or "URL not found",
            description="The base public HTTP API URL"
        )