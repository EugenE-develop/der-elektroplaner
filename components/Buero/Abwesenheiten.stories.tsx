// components/Buero/Abwesenheiten.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import Abwesenheiten from './Abwesenheiten';
import { mockCurrentUser, mockUsers, mockAbsences } from '../../stories/mockData';

const meta: Meta<typeof Abwesenheiten> = {
  title: 'Buero/Abwesenheiten',
  component: Abwesenheiten,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Abwesenheiten>;

// We need to mock the useOfficeData hook for this component to work in isolation.
// The best way is with storybook-msw-addon, but we can simulate with parameters.
// Our decorator in .storybook/preview.tsx already provides a default mock.

export const DefaultView: Story = {
  name: 'Default View (Manager)',
  args: {
    currentUser: mockCurrentUser, // Geschäftsführer
    users: mockUsers,
  },
  parameters: {
    appContext: {
        officeData: {
            absences: mockAbsences,
            // other office data...
        }
    }
  }
};

export const EmployeeView: Story = {
    name: 'Employee View (No Manager Rights)',
    args: {
      currentUser: mockUsers.find(u => u.role === 'Systemplaner')!,
      users: mockUsers,
    },
    parameters: {
        appContext: {
            currentUser: mockUsers.find(u => u.role === 'Systemplaner')!,
            officeData: {
                absences: mockAbsences,
            }
        }
    }
  };

  export const EmptyState: Story = {
    name: 'Empty State',
    args: {
      currentUser: mockCurrentUser,
      users: mockUsers,
    },
    parameters: {
        appContext: {
            officeData: {
                absences: [],
            }
        }
    }
  };
