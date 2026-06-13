import aws_cdk as core
import aws_cdk.assertions as assertions

from git_stand_up.git_stand_up_stack import GitStandUpStack

# example tests. To run these tests, uncomment this file along with the example
# resource in git_stand_up/git_stand_up_stack.py
def test_sqs_queue_created():
    app = core.App()
    stack = GitStandUpStack(app, "git-stand-up")
    template = assertions.Template.from_stack(stack)

#     template.has_resource_properties("AWS::SQS::Queue", {
#         "VisibilityTimeout": 300
#     })
