// components/transitions/TransitionComponents.js
import React from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import './ProfileTransitions.css';

export const ExpandableCard = ({ children, isExpanded }) => (
  <CSSTransition
    in={isExpanded}
    timeout={300}
    classNames="card-expand"
    unmountOnExit
  >
    <div className="overflow-hidden">
      {children}
    </div>
  </CSSTransition>
);

export const EditModeTransition = ({ isEditing, viewComponent, editComponent }) => (
  <SwitchTransition mode="out-in">
    <CSSTransition
      key={isEditing ? 'edit' : 'view'}
      timeout={200}
      classNames="edit-mode"
    >
      {isEditing ? editComponent : viewComponent}
    </CSSTransition>
  </SwitchTransition>
);

export const SectionTransition = ({ children }) => (
  <CSSTransition
    appear={true}
    in={true}
    timeout={300}
    classNames="section"
  >
    <div>
      {children}
    </div>
  </CSSTransition>
);