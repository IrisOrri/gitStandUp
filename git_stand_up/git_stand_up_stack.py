from aws_cdk import (
    Stack,
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,  # 👈 Added API Gateway import
    RemovalPolicy
)
from constructs import Construct

class GitStandUpStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # 📊 1. GitStand Commits & Standup Tracker Table
        git_standup_table = dynamodb.Table(
            self, "GitStandupDataTable",
            table_name="GitStandupData",
            partition_key=dynamodb.Attribute(
                name="user_id", 
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="record_id", 
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=1,
            write_capacity=1,
            removal_policy=RemovalPolicy.DESTROY
        )

        # ⚙️ 2. Ingestion Worker (AWS Lambda Function)
        webhook_worker = _lambda.Function(
            self, "WebhookWorkerFunction",
            runtime=_lambda.Runtime.PYTHON_3_11,
            code=_lambda.Code.from_asset("lambda"),
            handler="webhook_worker.handler",
            environment={
                "TABLE_NAME": git_standup_table.table_name
            }
        )

        # 🔐 3. Security Bridge (Grant Lambda write access to DynamoDB)
        git_standup_table.grant_write_data(webhook_worker)

        # 🌐 4. Public Gateway Bridge (Expose an HTTPS endpoint for GitHub Webhooks)
        # This will auto-generate a live URL endpoint that passes payloads directly to our Lambda worker
        api = apigateway.LambdaRestApi(
            self, "GitStandupWebhookApi",
            handler=webhook_worker,
            proxy=True,
            description="Production-grade public ingestion endpoint for GitHub webhook push events."
        )