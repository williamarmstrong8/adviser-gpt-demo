// AdvisorGPT Vault Data Types

export interface QuestionItem {
  id: string;
  type: "Commentary" | "Policy" | "Quantitative" | "Questionnaire";
  strategy: string | string[]; // Support both single and multiple strategies
  tags: string[];
  question?: string;
  answer?: string;
  body?: string;
  table?: {
    headers: string[];
    rows: string[][];
  };
  updatedAt: string; // ISO string
  updatedBy: string;
  isBestAnswer?: boolean; // Mark high-quality answers for badge display
}

export interface ContentItem {
  id: string;
  title: string;
  items: QuestionItem[];
}

export interface VaultFilters {
  strategy?: string | string[]; // Support both single and multiple strategies
  contentType?: string;
  tags?: string[];
  status?: string;
}

export interface VaultState {
  query: string;
  filters: VaultFilters;
  activeView: "files" | "type" | "strategy" | "data";
  sort: string;
}

// Tag management types
export interface TagInfo {
  name: string;
  status: "Approved" | "Candidate" | "Deactivated";
  usage: number;
}

// Available options
export const STRATEGIES = [
  "Firm-Wide (Not Strategy-Specific)",
  "Emerging Markets",
  "ESG", 
  "ESG Investments",
  "Fixed Income",
  "Global Emerging Markets", 
  "Global Equity",
  "Large Cap Equity",
  "Large Cap Growth",
  "S2 Strategy General",
  "Small Cap Value", 
  "Tech Sector"
];

export const CONTENT_TYPES = ["Data Files", "Policies", "Questionnaires"];

export const STATUS_OPTIONS = ["Active", "Archived", "Draft", "Under Review"];

export const TAGS_INFO: TagInfo[] = [
  { name: "Asset Allocation", status: "Deactivated", usage: 22 },
  { name: "Asset Management", status: "Approved", usage: 210 },
  { name: "Client Communication", status: "Approved", usage: 84 },
  { name: "Financial Analysis", status: "Approved", usage: 176 },
  { name: "Financial Services", status: "Approved", usage: 198 },
  { name: "Investment Management", status: "Approved", usage: 154 },
  { name: "Investment Strategy", status: "Approved", usage: 265 },
  { name: "Market Analysis", status: "Candidate", usage: 96 },
  { name: "Portfolio Management", status: "Approved", usage: 244 },
  { name: "Risk Management", status: "Approved", usage: 280 },
];