export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  isActive?: boolean;
}

export interface StatMetric {
  id: string;
  label: string;
  value: string;
  subtext?: string;
}

export interface LearningModule {
  id: string;
  code: string;
  title: string;
  description: string;
  concepts: string[];
}

export interface QuickStartExperiment {
  id: string;
  title: string;
  description: string;
  category: string;
  threads: string;
}

export interface ThreadStateInfo {
  state: string;
  description: string;
  badgeClass: string;
}
