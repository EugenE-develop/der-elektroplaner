// components/ProjectManagement/subcomponents/ProjectCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import ProjectCard from './ProjectCard';
import { mockProjects, mockUsers } from '../../../stories/mockData';
import { ProjectRisk } from '../../../types';

const meta: Meta<typeof ProjectCard> = {
  title: 'ProjectManagement/ProjectCard',
  component: ProjectCard,
  tags: ['autodocs'],
  argTypes: {
    onSelectProject: { action: 'projectSelected' },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '350px', margin: '2rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProjectCard>;

export const InExecution: Story = {
  args: {
    project: mockProjects[0],
    users: mockUsers,
    projectRisks: {},
  },
};

export const Completed: Story = {
  args: {
    project: mockProjects[1],
    users: mockUsers,
    projectRisks: {},
  },
};

export const WithHighRisk: Story = {
    args: {
        project: mockProjects[0],
        users: mockUsers,
        projectRisks: {
            'p1': { level: 'Hoch', reason: 'Budgetüberschreitung in KG 440 wahrscheinlich.' } as ProjectRisk,
        },
    }
};

export const WithMediumRisk: Story = {
    args: {
        project: mockProjects[0],
        users: mockUsers,
        projectRisks: {
            'p1': { level: 'Mittel', reason: 'Verzögerung bei der Materiallieferung.' } as ProjectRisk,
        },
    }
};

export const WithLowRisk: Story = {
    args: {
        project: mockProjects[1],
        users: mockUsers,
        projectRisks: {
            'p2': { level: 'Niedrig', reason: 'Alles nach Plan.' } as ProjectRisk,
        },
    }
};

export const NoAssignedSystems: Story = {
    args: {
        project: {
            ...mockProjects[0],
            assignedSystems: [],
        },
        users: mockUsers,
        projectRisks: {},
    }
}
