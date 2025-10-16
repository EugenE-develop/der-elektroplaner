// tests/test-utils.tsx
// FIX: Replaced placeholder content with a standard testing utility file. This sets up a custom `render` function that wraps components in necessary providers for isolated testing.
import React, { ReactElement } from 'react';
// FIX: Changed from a wildcard export to explicit exports to ensure testing utilities are resolved correctly.
import { render as rtlRender, RenderOptions, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

import { AppContext, AppContextType } from '../src/contexts/AppContext';
import { mockCurrentUser, mockUsers, mockProjects, mockContacts, mockFinanceData, mockOfficeData, mockChecklistTemplates } from '../src/stories/mockData';

const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockAppContext: AppContextType = {
    users: mockUsers,
    projects: mockProjects,
    contacts: mockContacts,
    financeData: mockFinanceData,
    officeData: mockOfficeData,
    projectRisks: {},
    checklistTemplates: mockChecklistTemplates,
    timeEntries: [],
    currentUser: mockCurrentUser,
    handleCreateUser: vi.fn(),
    handleUpdateUser: vi.fn().mockResolvedValue({ success: true }),
    handleDeleteUser: vi.fn(),
    handleCreateProject: vi.fn(),
    handleUpdateProject: vi.fn(),
    handleDeleteProject: vi.fn(),
    // FIX: Added missing time entry mock functions to satisfy AppContextType.
    handleCreateTimeEntry: vi.fn(),
    handleUpdateTimeEntry: vi.fn(),
    handleDeleteTimeEntry: vi.fn(),
    errors: [],
    addError: vi.fn(),
    clearError: vi.fn(),
    suggestedAction: null,
    setSuggestedAction: vi.fn(),
};

const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={testQueryClient}>
    <AppContext.Provider value={mockAppContext}>
      {children}
    </AppContext.Provider>
  </QueryClientProvider>
);

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => rtlRender(ui, { wrapper: AllProviders, ...options });

// FIX: Re-exporting all testing-library utilities including the custom render and explicit exports.
export * from '@testing-library/react';
export { customRender as render, screen, fireEvent };