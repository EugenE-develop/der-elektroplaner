// components/LoginScreen/LoginScreen.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, fn } from '@storybook/test';
import LoginScreen from './LoginScreen';

const meta: Meta<typeof LoginScreen> = {
  title: 'Screens/LoginScreen',
  component: LoginScreen,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof LoginScreen>;

export const Default: Story = {};

export const WithError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const emailInput = await canvas.findByLabelText(/E-Mail/i);
    const passwordInput = await canvas.findByLabelText(/Passwort/i);
    const submitButton = await canvas.findByRole('button', { name: /Anmelden/i });

    await userEvent.type(emailInput, 'falsch@test.com', { delay: 50 });
    await userEvent.type(passwordInput, 'falschesPasswort', { delay: 50 });
    
    // This part would typically rely on mocking the supabase call,
    // but for a visual test, we can just check the button click.
    // For now, we'll just show the filled form.
    // In a real scenario, you'd use storybook-msw-addon to mock API calls.
  },
};

export const Submitting: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const emailInput = await canvas.findByLabelText(/E-Mail/i);
        const passwordInput = await canvas.findByLabelText(/Passwort/i);
        const submitButton = await canvas.findByRole('button', { name: /Anmelden/i });

        await userEvent.type(emailInput, 'test@test.com');
        await userEvent.type(passwordInput, 'password');
        await userEvent.click(submitButton);

        // Storybook can't easily show the "isSubmitting" state from react-hook-form without complex mocks.
        // This play function demonstrates how user interaction tests are written.
    },
};
