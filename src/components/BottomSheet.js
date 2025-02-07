import React, { useState, useRef, useEffect } from 'react';

const BottomSheet = ({ isOpen, onClose, initialHeight = 100, children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentHeight, setCurrentHeight] = useState(initialHeight);
  const sheetRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    setCurrentHeight(initialHeight);
  }, [isOpen, initialHeight]);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;

    const deltaY = startY - e.touches[0].clientY;
    const newHeight = currentHeight + deltaY;

    // Limit the height between min and max values
    const limitedHeight = Math.min(Math.max(newHeight, 60), window.innerHeight * 0.8);
    setCurrentHeight(limitedHeight);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Snap to preset heights
    if (currentHeight < 120) {
      setCurrentHeight(60);  // Minimized
    } else if (currentHeight > window.innerHeight * 0.6) {
      setCurrentHeight(window.innerHeight * 0.8);  // Maximized
    } else {
      setCurrentHeight(280);  // Default expanded
    }
  };

  return (
    <div 
      ref={sheetRef}
      className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-white rounded-t-2xl 
        border-t border-slate-200
        shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]
        transition-transform duration-300 ease-out
        ${!isOpen ? 'translate-y-full' : 'translate-y-0'}
      `}
      style={{ 
        height: `${currentHeight}px`,
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)'
      }}
    >
      {/* Drag Handle */}
      <div 
        ref={dragRef}
        className="absolute top-0 left-0 right-0 h-10 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3" />
      </div>

      {/* Content */}
      <div className="px-4 pt-8 pb-4 h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default BottomSheet;