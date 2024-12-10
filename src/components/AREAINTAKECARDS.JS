import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

const BODY_AREAS = [
  {
    id: 'upper_back_shoulders',
    label: 'Upper Back & Shoulders',
    anatomicalTerms: 'Trapezius • Rhomboids • Posterior Deltoids',
    description: 'Upper back muscles and shoulder blade area',
    placeholderNote: 'Share any specific concerns or treatment preferences...',
    commonConditions: [
      'Postural tension',
      'Shoulder blade tightness',
      'Computer-related strain',
      'Exercise soreness',
      'Stress tension'
    ],
    radiationPatterns: [
      'Between shoulder blades',
      'Across shoulders',
      'Down arms',
      'Up to neck'
    ]
  },
  {
    id: 'middle_back_lats',
    label: 'Middle Back & Lats',
    anatomicalTerms: 'Latissimus Dorsi • Middle Trapezius • Erector Spinae',
    description: 'Mid-back region including side muscles',
    placeholderNote: 'Note any mid-back issues or preferences...',
    commonConditions: [
      'Athletic tension',
      'Postural issues',
      'Muscle tightness',
      'Workout soreness'
    ],
    radiationPatterns: [
      'To shoulder blades',
      'Around ribcage',
      'To lower back',
      'Along spine'
    ]
  },
  {
    id: 'lower_back',
    label: 'Lower Back',
    anatomicalTerms: 'Lower Erector Spinae • Quadratus Lumborum',
    description: 'Lower back and lumbar region',
    placeholderNote: 'Describe any lower back conditions or preferences...',
    commonConditions: [
      'General stiffness',
      'Athletic strain',
      'Postural tension',
      'Exercise related'
    ],
    radiationPatterns: [
      'To hips',
      'Across lower back',
      'To upper back',
      'Down legs'
    ]
  },
  {
    id: 'glutes_hips',
    label: 'Glutes & Hip Area',
    anatomicalTerms: 'Gluteus Maximus • Gluteus Medius • Hip Rotators',
    description: 'Buttocks and hip region',
    placeholderNote: 'Share any hip or glute-related concerns...',
    commonConditions: [
      'Sitting tension',
      'Athletic tightness',
      'Hip stiffness',
      'Exercise soreness'
    ],
    radiationPatterns: [
      'To lower back',
      'Down leg',
      'To hip joint',
      'Across glutes'
    ]
  },
  {
    id: 'hamstrings',
    label: 'Hamstrings',
    anatomicalTerms: 'Biceps Femoris • Semitendinosus • Semimembranosus',
    description: 'Back of thigh muscles',
    placeholderNote: 'Note any hamstring-specific concerns...',
    commonConditions: [
      'Exercise tightness',
      'Running tension',
      'Flexibility issues',
      'General soreness'
    ],
    radiationPatterns: [
      'To knee',
      'To glutes',
      'Down leg',
      'Behind thigh'
    ]
  },
  {
    id: 'calves',
    label: 'Calves & Achilles',
    anatomicalTerms: 'Gastrocnemius • Soleus • Achilles Tendon',
    description: 'Lower leg posterior muscles',
    placeholderNote: 'Describe any calf or Achilles concerns...',
    commonConditions: [
      'Exercise tension',
      'Running tightness',
      'General soreness',
      'Athletic strain'
    ],
    radiationPatterns: [
      'To ankle',
      'Up leg',
      'To heel',
      'Throughout calf'
    ]
  }
];

export default function BodyAreaSelector() {
  const [selectedAreas, setSelectedAreas] = useState({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [expandedAreas, setExpandedAreas] = useState(() => 
    // Start with all areas expanded
    BODY_AREAS.reduce((acc, area) => ({ ...acc, [area.id]: true }), {})
  );

  const handleAreaSelect = (areaId, updates) => {
    setSelectedAreas(prev => ({
      ...prev,
      [areaId]: {
        ...prev[areaId] || {},
        ...updates
      }
    }));
  };

  const toggleExpanded = (areaId) => {
    setExpandedAreas(prev => ({
      ...prev,
      [areaId]: !prev[areaId]
    }));
  };

  return (
    <div className="p-4 bg-white min-h-screen">
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">Treatment Areas</h2>
      <p className="text-slate-600 mb-6">Customize your massage experience</p>
      
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Area Selection */}
        <div className="space-y-4">
          {BODY_AREAS.map(area => {
            const isSelected = selectedAreas[area.id]?.pressure !== undefined;
            const isExpanded = expandedAreas[area.id];
            const currentPressure = selectedAreas[area.id]?.pressure || 50;
            const selectedConditions = selectedAreas[area.id]?.conditions || [];
            const selectedPatterns = selectedAreas[area.id]?.patterns || [];
            
            return (
              <div 
                key={area.id} 
                className={`bg-white rounded-lg border ${
                  isSelected ? 'border-[#2DD4BF]' : 'border-slate-200'
                } shadow-sm transition-all duration-200`}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-slate-900">{area.label}</h3>
                      <p className="text-sm text-slate-500">{area.anatomicalTerms}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-sm font-medium text-slate-700">
                          Pressure Level: {currentPressure}
                        </label>
                        <span className="text-sm text-[#2DD4BF] font-medium">
                          {currentPressure <= 33 ? 'Gentle' : currentPressure <= 66 ? 'Moderate' : 'Deep'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={currentPressure}
                        onChange={(e) => handleAreaSelect(area.id, { pressure: parseInt(e.target.value) })}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#2DD4BF]"
                      />
                    </div>

                    <button
                      onClick={() => toggleExpanded(area.id)}
                      className="flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={16} className="mr-1" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} className="mr-1" />
                          Show more
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="space-y-4">
                        {/* Common Conditions */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Common Conditions
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {area.commonConditions.map(condition => (
                              <button
                                key={condition}
                                onClick={() => {
                                  const conditions = selectedAreas[area.id]?.conditions || [];
                                  const updated = conditions.includes(condition)
                                    ? conditions.filter(c => c !== condition)
                                    : [...conditions, condition];
                                  handleAreaSelect(area.id, { conditions: updated });
                                }}
                                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                  selectedConditions.includes(condition)
                                    ? 'bg-[#2DD4BF] bg-opacity-10 text-[#2DD4BF]'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {condition}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Radiation Patterns */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Sensation Patterns
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {area.radiationPatterns.map(pattern => (
                              <button
                                key={pattern}
                                onClick={() => {
                                  const patterns = selectedAreas[area.id]?.patterns || [];
                                  const updated = patterns.includes(pattern)
                                    ? patterns.filter(p => p !== pattern)
                                    : [...patterns, pattern];
                                  handleAreaSelect(area.id, { patterns: updated });
                                }}
                                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                  selectedPatterns.includes(pattern)
                                    ? 'bg-slate-700 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {pattern}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Special Instructions
                          </label>
                          <textarea
                            value={selectedAreas[area.id]?.note || ''}
                            onChange={(e) => handleAreaSelect(area.id, { note: e.target.value })}
                            placeholder={area.placeholderNote}
                            className="w-full h-20 px-3 py-2 text-sm border border-slate-200 rounded-lg placeholder:text-slate-400 focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column - Summary */}
        <div>
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sticky top-4">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Treatment Summary</h3>
            
            {Object.keys(selectedAreas).length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                Select pressure levels and conditions to begin customizing your treatment.
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(selectedAreas).map(([areaId, data]) => {
                  const area = BODY_AREAS.find(a => a.id === areaId);
                  return (
                    <div key={areaId} className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">{area?.label}</h4>
                        <span className="text-sm text-[#2DD4BF] font-medium">
                          {data.pressure <= 33 ? 'Gentle' : data.pressure <= 66 ? 'Moderate' : 'Deep'} ({data.pressure})
                        </span>
                      </div>
                      
                      {data.conditions?.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {data.conditions.map(condition => (
                              <span key={condition} className="inline-flex items-center px-2 py-1 rounded-md bg-[#2DD4BF] bg-opacity-10 text-xs text-[#2DD4BF]">
                                {condition}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {data.patterns?.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {data.patterns.map(pattern => (
                              <span key={pattern} className="inline-flex items-center px-2 py-1 rounded-md bg-slate-200 text-xs text-slate-700">
                                {pattern}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {data.note && (
                        <p className="text-sm text-slate-600 mt-2 pt-2 border-t border-slate-200">
                          {data.note}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Any other preferences or concerns you'd like to share..."
                className="w-full h-24 px-3 py-2 text-sm border border-slate-200 rounded-lg placeholder:text-slate-400 focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}