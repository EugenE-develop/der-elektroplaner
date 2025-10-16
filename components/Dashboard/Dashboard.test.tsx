// components/Dashboard/Dashboard.test.tsx
// FIX: Replaced placeholder content with a basic test for the Dashboard component.
import React from 'react';
// FIX: Corrected import to use the custom render and screen from test-utils.
import { render, screen } from '../../tests/test-utils';
import Dashboard from './Dashboard';
import { mockCurrentUser, mockProjects } from '../../stories/mockData';
// FIX: Imported test globals from vitest to resolve TS errors.
import { describe, it, expect, vi } from 'vitest';

describe('Dashboard', () => {
  it('renders a welcome message for the current user', () => {
    // FIX: Pass the required 'onNavigate' prop to the Dashboard component.
    render(<Dashboard onNavigate={vi.fn()} />);
    expect(screen.getByText(`Willkommen, ${mockCurrentUser.name}!`)).toBeInTheDocument();
  });

  it('displays project statistics', () => {
    // FIX: Pass the required 'onNavigate' prop to the Dashboard component.
    render(<Dashboard onNavigate={vi.fn()} />);
    const activeProjectsCount = mockProjects.filter(p => p.status === 'In Ausführung' || p.status === 'In Planung').length;
    const totalProjectsCount = mockProjects.length;

    expect(screen.getByText('Aktive Projekte')).toBeInTheDocument();
    expect(screen.getByText('Gesamtprojekte')).toBeInTheDocument();
    
    // Find the elements that contain the numbers and check their content
    const activeProjectsElement = screen.getByText(activeProjectsCount.toString());
    const totalProjectsElement = screen.getByText(totalProjectsCount.toString());

    expect(activeProjectsElement).toBeInTheDocument();
    expect(totalProjectsElement).toBeInTheDocument();
  });
});