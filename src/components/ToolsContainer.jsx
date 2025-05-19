import React from 'react';
import ROICalculator from './tools/ROICalculator';

const ToolsContainer = ({ projectId }) => {
  const renderTool = (toolId) => {
    switch (toolId) {
      // ...existing cases...
      case 'roiCalculator':
        return <ROICalculator projectId={projectId} />;
      // ...existing code...
    }
  };

  return (
    <div>
      {/* ...existing code... */}
      {renderTool('roiCalculator')}
      {/* ...existing code... */}
    </div>
  );
};

export default ToolsContainer;