// components/Todo/TaskCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import TaskCard from './TaskCard';
import { mockUsers } from '../../stories/mockData';
import { TodoItem } from '../../types';

const meta: Meta<typeof TaskCard> = {
  title: 'Todo/TaskCard',
  component: TaskCard,
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
    onDelete: { action: 'deleted' },
    onDragStart: { action: 'dragStarted' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '280px', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TaskCard>;

const baseTask: TodoItem = {
    id: 'task-1',
    title: 'Brandschutzkonzept finalisieren und einreichen',
    description: 'Das Konzept muss mit den neuesten Änderungen aktualisiert und an die Baubehörde gesendet werden.',
    dueDate: '2024-08-15',
    assigneeId: mockUsers[2].id, // Petra Projekt
    priority: 'Mittel',
};

export const LowPriority: Story = {
  args: {
    task: { ...baseTask, priority: 'Niedrig' },
    teamMembers: mockUsers,
  },
};

export const MediumPriority: Story = {
  args: {
    task: { ...baseTask, priority: 'Mittel' },
    teamMembers: mockUsers,
  },
};

export const HighPriority: Story = {
  args: {
    task: { ...baseTask, priority: 'Hoch' },
    teamMembers: mockUsers,
  },
};

export const UrgentPriority: Story = {
  args: {
    task: { ...baseTask, priority: 'Dringend' },
    teamMembers: mockUsers,
  },
};

export const Unassigned: Story = {
  args: {
    task: { ...baseTask, assigneeId: null },
    teamMembers: mockUsers,
  },
};

export const LongTitle: Story = {
    args: {
      task: { ...baseTask, title: 'Sehr lange Aufgabe, die potenziell umbrechen könnte, um das Layout zu testen und sicherzustellen, dass alles gut aussieht.' },
      teamMembers: mockUsers,
    },
  };
