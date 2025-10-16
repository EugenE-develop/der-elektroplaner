// .storybook/preview.tsx
import React from 'react';
import type { Preview, Decorator } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppContext, AppContextType } from '../src/contexts/AppContext';
import { mockCurrentUser, mockUsers, mockProjects, mockContacts, mockFinanceData, mockOfficeData, mockAdminData, mockChecklistTemplates } from '../src/stories/mockData';
import '../src/index.css'; // Import global styles to be applied to all stories

// Create a client
const queryClient = new QueryClient();

// Create a mock context that provides default values and no-op functions for actions
const mockAppContextValue: AppContextType = {
    users: mockUsers,
    projects: mockProjects,
    contacts: mockContacts,
    financeData: mockFinanceData,
    officeData: mockOfficeData,
    projectRisks: {},
    // FIX: Replaced deprecated `servicePhaseDefinitions` with `checklistTemplates`.
    checklistTemplates: mockChecklistTemplates,
    timeEntries: [],
    currentUser: mockCurrentUser,
    handleCreateUser: async (data) => { console.log('Storybook Action: Create User', data); },
    handleUpdateUser: async (id, updates) => { console.log('Storybook Action: Update User', id, updates); return { success: true }; },
    handleDeleteUser: async (id) => { console.log('Storybook Action: Delete User', id); },
    handleCreateProject: async (data) => { console.log('Storybook Action: Create Project', data); },
    handleUpdateProject: async (id, updates) => { console.log('Storybook Action: Update Project', id, updates); },
    handleDeleteProject: async (id) => { console.log('Storybook Action: Delete Project', id); },
    // FIX: Added missing time entry handlers to satisfy AppContextType.
    handleCreateTimeEntry: async (entry) => { console.log('Storybook Action: Create Time Entry', entry); },
    handleUpdateTimeEntry: async (entry) => { console.log('Storybook Action: Update Time Entry', entry); },
    handleDeleteTimeEntry: async (id) => { console.log('Storybook Action: Delete Time Entry', id); },
    errors: [],
    addError: (message, details) => { console.error('Storybook Error:', message, details); },
    clearError: (id) => { console.log('Storybook: Clear Error', id); },
    suggestedAction: null,
    setSuggestedAction: (action) => { console.log('Storybook Action: Set Suggested Action', action); },
};

// A global decorator to wrap all stories with necessary providers
const withProviders: Decorator = (Story, context) => {
    // Allow stories to override parts of the context via parameters
    const storyContextValue = { ...mockAppContextValue, ...context.parameters.appContext };

    // Apply dark mode if specified in story parameters
    const isDark = context.globals.backgrounds?.value === '#111827';

    return (
        <QueryClientProvider client={queryClient}>
            <AppContext.Provider value={storyContextValue}>
                <div id="story-wrapper" className={isDark ? 'dark' : ''} style={{ height: '100%', width: '100%', backgroundColor: 'var(--background-color)' }}>
                    <Story />
                </div>
            </AppContext.Provider>
        </QueryClientProvider>
    );
};

const preview: Preview = {
    parameters: {
        actions: { argTypesRegex: '^on[A-Z].*' },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
        // Add background options for dark/light mode testing
        backgrounds: {
            default: 'light',
            values: [
                { name: 'light', value: '#f4f5f7' },
                { name: 'dark', value: '#111827' },
            ],
        },
    },
    // Apply the decorator to all stories
    decorators: [withProviders],
};

export default preview;