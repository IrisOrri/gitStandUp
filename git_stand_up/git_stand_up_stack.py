from aws_cdk import (
    Stack,
    aws_dynamodb as dynamodb,
    RemovalPolicy
)
from constructs import Construct

class GitStandUpStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # GitStand Commits & Standup Tracker Table
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
            # Provisioned mode with 1 WCU/RCU ensures it strictly fits inside the $0 Free Tier!
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=1,
            write_capacity=1,
            # DESTROY means if we delete this project later, it cleans up automatically (No zombie costs!)
            removal_policy=RemovalPolicy.DESTROY
        )