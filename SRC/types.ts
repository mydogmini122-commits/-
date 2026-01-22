
export interface RetirementData {
  currentAge: number;
  retireAge: number;
  currentSavings: number;
  monthlySavings: number; // Renamed conceptually to monthly investment
  monthlyExpenses: number;
  expectedLifeSpan: number;
  gender: 'male' | 'female' | 'other';
  expectedROI: number; // Percentage
  inflationRate: number; // Percentage
}

export interface CalculationResult {
  totalNeeded: number;
  projectedTotal: number;
  shortfall: number;
  isEnough: boolean;
  yearsCovered: number;
  dataPoints: Array<{ age: number; balance: number }>;
}

export interface RoastResult {
  mainRoast: string;
  savingTips: string[];
}
