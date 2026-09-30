export interface PatientVitals {
  temp: number;          // Celsius
  bpSystolic: number;    // mmHg
  bpDiastolic: number;   // mmHg
  pulse: number;         // bpm
  spo2: number;          // %
  respiratoryRate: number; // breaths/min
}

export interface TriageResult {
  score: number;
  category: 'RED' | 'YELLOW' | 'GREEN';
  urgencyLabel: string;
  flaggedReasons: string[];
}

export function evaluateClinicalTriage(vitals: PatientVitals, symptoms: string[]): TriageResult {
  let score = 0;
  const flaggedReasons: string[] = [];

  // 1. SpO2 (Oxygen Saturation)
  if (vitals.spo2 > 0 && vitals.spo2 < 90) {
    score += 4;
    flaggedReasons.push('Critical Hypoxemia (SpO2 < 90%)');
  } else if (vitals.spo2 >= 90 && vitals.spo2 <= 94) {
    score += 2;
    flaggedReasons.push('Mild/Moderate Hypoxemia (SpO2 90-94%)');
  }

  // 2. Systolic Blood Pressure (Shock vs Crisis)
  if (vitals.bpSystolic > 0 && vitals.bpSystolic < 85) {
    score += 4;
    flaggedReasons.push('Severe Hypotension / Shock Risk (BP < 85)');
  } else if (vitals.bpSystolic > 180 || vitals.bpDiastolic > 110) {
    score += 3;
    flaggedReasons.push('Hypertensive Emergency (BP > 180/110)');
  }

  // 3. Heart Rate (Pulse)
  if (vitals.pulse > 130 || (vitals.pulse > 0 && vitals.pulse < 45)) {
    score += 3;
    flaggedReasons.push('Severe Tachycardia / Bradycardia');
  } else if (vitals.pulse > 105) {
    score += 1;
    flaggedReasons.push('Elevated Pulse (> 105 bpm)');
  }

  // 4. Respiratory Rate
  if (vitals.respiratoryRate > 28 || (vitals.respiratoryRate > 0 && vitals.respiratoryRate < 9)) {
    score += 3;
    flaggedReasons.push('Respiratory Distress / Severe Bradypnea');
  } else if (vitals.respiratoryRate > 20) {
    score += 1;
    flaggedReasons.push('Tachypnea (> 20 / min)');
  }

  // 5. Temperature
  if (vitals.temp > 39.0) {
    score += 2;
    flaggedReasons.push('High Grade Hyperpyrexia (> 39.0°C)');
  }

  // 6. Clinical Red-Flag Symptoms
  const acuteRiskTerms = [
    'Chest Pain (Radiating)',
    'Loss of Consciousness',
    'Severe Dehydration',
    'Acute Shortness of Breath',
    'Uncontrolled Bleeding'
  ];

  symptoms.forEach(s => {
    if (acuteRiskTerms.includes(s)) {
      score += 4;
      flaggedReasons.push(`Red Flag: ${s}`);
    }
  });

  if (score >= 5) {
    return {
      score,
      category: 'RED',
      urgencyLabel: 'CODE RED: IMMEDIATE EMERGENCY REFERRAL',
      flaggedReasons
    };
  } else if (score >= 2) {
    return {
      score,
      category: 'YELLOW',
      urgencyLabel: 'CODE YELLOW: PRIORITY TELE-CONSULT (< 6 HRS)',
      flaggedReasons
    };
  }

  return {
    score,
    category: 'GREEN',
    urgencyLabel: 'CODE GREEN: ROUTINE PRIMARY CARE MONITORING',
    flaggedReasons: flaggedReasons.length ? flaggedReasons : ['Stable Parameters']
  };
}