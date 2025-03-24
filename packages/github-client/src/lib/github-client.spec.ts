import { githubClient } from './github-client';

describe('githubClient', () => {
  it('should work', () => {
    expect(githubClient()).toEqual('github-client');
  });
});
