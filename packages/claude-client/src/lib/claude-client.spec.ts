import { claudeClient } from './claude-client';

describe('claudeClient', () => {
  it('should work', () => {
    expect(claudeClient()).toEqual('claude-client');
  });
});
