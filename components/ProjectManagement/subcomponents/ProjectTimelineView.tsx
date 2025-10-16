import React, { FC } from 'react';
import { Project } from '../../../types';

const ProjectTimelineView: FC<{project: Project}> = ({ project }) => {
  return (
    <div>
      <h3>Zeitablauf für {project.name}</h3>
      {/* Component content will be implemented here */}
    </div>
  );
};

export default ProjectTimelineView;