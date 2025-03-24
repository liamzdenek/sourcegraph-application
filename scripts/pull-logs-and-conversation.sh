#!/bin/bash

# Set AWS profile
AWS_PROFILE="lz-demos"

echo "Pulling logs from CloudWatch..."
aws logs get-log-events \
  --log-group-name "/aws/batch/job" \
  --log-stream-name "JobDefinition-Q7XYsqkzhrhXOM5X/default/1e85ae5d0d64406b8d2337e4f5a024d9" \
  --profile $AWS_PROFILE \
  --output json > batch-job-logs.json

echo "Logs saved to batch-job-logs.json"

echo "Pulling Claude conversation from DynamoDB..."
aws dynamodb get-item \
  --table-name "CodyBatchStack-RepositoriesTable15FA3697-BNQH46SJXX44" \
  --key '{"jobId": {"S": "job-1742845715448-107"}, "repositoryName": {"S": "liamzdenek/vulerable-log4j-sample"}}' \
  --profile $AWS_PROFILE \
  --output json > claude-conversation.json

echo "Claude conversation saved to claude-conversation.json"

# Extract the Claude conversation for easier reading
echo "Extracting Claude conversation..."
if [ -f claude-conversation.json ]; then
  echo "Extracting Claude conversation to claude-conversation-formatted.json"
  # Use jq to extract and format the Claude conversation if jq is available
  if command -v jq &> /dev/null; then
    jq '.Item.claudeConversation' claude-conversation.json > claude-conversation-formatted.json
    echo "Claude conversation extracted to claude-conversation-formatted.json"
  else
    echo "jq not found, skipping extraction"
  fi
fi

echo "Done!"