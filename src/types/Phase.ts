export interface Choice {
  id: string;
  text: string;
  correct: boolean;
  consequence: string;
  clueReward?: string;
  transformationDelta?: number;
  justification: string;
}

export interface Phase {
  id: number;
  title: string;
  act: number;
  intro: string;
  scene: string;
  objective: string;
  image: string;
  music?: string;
  ambience?: string;
  choices: Choice[];
  clueReward?: string;
  symbolReward?: string;
  revelation?: string;
  cliffhanger: string;
  justification: string;
  respiroPhase: boolean;
}
