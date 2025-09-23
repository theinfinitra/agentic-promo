// Agent Response Types
export interface AgentResponse {
  type: 'acknowledgment' | 'response' | 'error';
  chat_response?: string;
  structured_data?: StructuredData;
  message?: string;
}

// UI Component Types
export interface StructuredData {
  type: 'table' | 'form' | 'notification' | 'html' | 'card';
  title?: string;
  data?: any[];
  columns?: TableColumn[];
  fields?: FormField[];
  config?: ComponentConfig;
  content?: string; // For HTML type
}

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'badge' | 'number' | 'date';
  sortable?: boolean;
  clickable?: boolean;
  action?: string;
  colors?: Record<string, string>;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'date';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  default?: any;
}

export interface ComponentConfig {
  message?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  actions?: ComponentAction[];
  pagination?: {
    enabled: boolean;
    pageSize: number;
    total?: number;
  };
}

export interface ComponentAction {
  label: string;
  icon?: string;
  action: string;
  type?: 'button' | 'submit' | 'link';
  variant?: 'primary' | 'secondary' | 'danger';
}

// Chat Types
export interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  structured_data?: StructuredData;
  raw_response?: string;
  expanded?: boolean;
}

// WebSocket Types
export interface WebSocketMessage {
  input: string;
  intent?: string;
}
