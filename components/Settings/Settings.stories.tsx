// components/Settings/Settings.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Settings } from './Settings';
import { mockAdminUser } from '../../stories/mockData';

const meta: Meta<typeof Settings> = {
  title: 'Screens/Settings',
  component: Settings,
  tags: ['autodocs'],
  parameters: {
    // Overriding the default mock context to use a specific user for this story
    appContext: {
        currentUser: mockAdminUser,
    },
  },
  argTypes: {
    onUpdatePassword: { action: 'updatePassword' },
    onUpdateUser: { action: 'updateUser' },
  },
};

export default meta;
type Story = StoryObj<typeof Settings>;

export const Default: Story = {
    args: {
        // Mock functions for props
        onUpdatePassword: async (newPassword: string) => {
            console.log('Attempting to update password to:', newPassword);
            // Simulate a successful update
            return true;
        },
    }
};