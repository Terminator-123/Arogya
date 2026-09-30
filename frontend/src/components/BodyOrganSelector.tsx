import React, { useState } from 'react';
import { Heart, Brain, Wind, Activity } from 'lucide-react';

interface OrganCategory {
  id: string;
  name: string;
  marathiName: string;
  hindiName: string;
  icon: any;
  symptoms: string[];
}

const ORGAN_CATEGORIES: OrganCategory[] = [
  {
    id: 'chest',
    name: 'Heart & Chest',
    marathiName: 'छाती व हृदय',
    hindiName: 'छाती एवं हृदय',
    icon: Heart,
    symptoms: ['Chest Pain (Radiating)', 'Severe Palpitations', 'High Blood Pressure']
  },
  {
    id: 'lungs',
    name: 'Respiratory / Lungs',
    marathiName: 'श्वास व फुफ्फुस',
    hindiName: 'फेफड़े एवं श्वसन',
    icon: Wind,
    symptoms: ['Acute Shortness of Breath', 'Productive Cough', 'Wheezing / Stridor']
  },
  {
    id: 'brain',
    name: 'Head & Neuro',
    marathiName: 'डोके व मेंदू',
    hindiName: 'सिर एवं तंत्रिका',
    icon: Brain,
    symptoms: ['Loss of Consciousness', 'Severe Headache', 'Altered Mental State']
  },
  {
    id: 'gut',
    name: 'Abdomen & Systemic',
    marathiName: 'पोट व पचनसंस्था',
    hindiName: 'पेट एवं पाचन',
    icon: Activity,
    symptoms: ['High Fever (>3 days)', 'Severe Diarrhea/Vomiting', 'Uncontrolled Bleeding']
  }
];

interface BodySelectorProps {
  selectedSymptoms: string[];
  onToggleSymptom: (symptom: string) => void;
  lang: 'en' | 'mr' | 'hi';
}

export const BodyOrganSelector: React.FC<BodySelectorProps> = ({ selectedSymptoms, onToggleSymptom, lang }) => {
  const [activeOrgan, setActiveOrgan] = useState<string>('chest');

  const currentCategory = ORGAN_CATEGORIES.find(c => c.id === activeOrgan) || ORGAN_CATEGORIES[0];

  return (
    <div className="space-y-3">
      {/* Organ Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ORGAN_CATEGORIES.map(org => {
          const Icon = org.icon;
          const isSelected = activeOrgan === org.id;
          const label = lang === 'mr' ? org.marathiName : lang === 'hi' ? org.hindiName : org.name;
          return (
            <button
              type="button"
              key={org.id}
              onClick={() => setActiveOrgan(org.id)}
              className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs font-bold transition cursor-pointer ${
                isSelected
                  ? 'bg-green-700 text-white border-green-700 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-300' : 'text-slate-500'}`} />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Symptoms under active organ */}
      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-wrap gap-2">
        {currentCategory.symptoms.map(sym => {
          const isChosen = selectedSymptoms.includes(sym);
          return (
            <button
              type="button"
              key={sym}
              onClick={() => onToggleSymptom(sym)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                isChosen
                  ? 'bg-green-600 text-white border-green-600 font-semibold shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
              }`}
            >
              {sym}
            </button>
          );
        })}
      </div>
    </div>
  );
};
