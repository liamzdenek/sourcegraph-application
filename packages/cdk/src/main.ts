#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CodyBatchStack } from './lib/cody-batch-stack';

const app = new cdk.App();
new CodyBatchStack(app, 'CodyBatchStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
  },
  description: 'Cody Batch - AI-powered repository remediation using Claude 3.7',
});

app.synth();
