import { context, reddit } from '@devvit/web/server';

export type MenuResponse = {
  showToast?: {
    message: string;
    type?: 'success' | 'error';
  };
  navigateTo?: string;
};

export const createPost = async (): Promise<MenuResponse> => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  const post = await reddit.submitCustomPost({
    splash: {
      appDisplayName: 'reddy-pet',
    },
    subredditName,
    title: 'reddy-pet',
  });

  return {
    showToast: {
      message: 'Interactive post created!',
      type: 'success',
    },
    navigateTo: post.permalink ?? `/r/${subredditName}`,
  };
};
