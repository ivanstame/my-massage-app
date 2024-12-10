import React from 'react';
import { ExpandableCard, EditModeTransition } from './transitions/TransitionComponents';

const TreatmentCard = ({ 
  data, 
  isExpanded, 
  isEditing, 
  onToggleExpand, 
  onEdit 
}) => {
  const ViewMode = (
    <div className="card-content">
      <h3>{data.label}</h3>
      <p>Pressure: {data.pressure}</p>
      {/* Other view mode content */}
    </div>
  );

  const EditMode = (
    <div className="card-edit-content">
      {/* Edit form content */}
    </div>
  );

  return (
    <div className="treatment-card">
      <div className="card-header" onClick={onToggleExpand}>
        {/* Always visible content */}
      </div>

      <ExpandableCard isExpanded={isExpanded}>
        <EditModeTransition
          isEditing={isEditing}
          viewComponent={ViewMode}
          editComponent={EditMode}
        />
      </ExpandableCard>
    </div>
  );
};

export default TreatmentCard;