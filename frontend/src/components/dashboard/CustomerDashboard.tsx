import React, { useState, useEffect } from 'react';
import { AICompanion } from './AICompanion';
import { VoiceInterface } from './VoiceInterface';

// Professional Intelligence Color Scheme
const colors = {
  primary: '#2B2B2B',        
  primary2: '#174D38',       
  primary3: '#9B1313',       
  primaryLight: '#B3B3B3',   
  primaryDark: '#9B1313',    
  success: '#174D38',        
  warning: '#9B1313',        
  danger: '#9B1313',         
  background: '#F2F2F2',     
  surface: '#FFFFFF',        
  border: '#CBCBCB',         
  textPrimary: '#9B1313',    
  textSecondary: '#174D38',  
  textMuted: '#CBCBCB',      
  accent1: '#174D38',        
  accent2: '#9B1313',        
  accent3: '#174D38',        
  accent4: '#9B1313'         
};

interface Customer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  churnRisk: number;
  segment: string;
  lifecycleStage: string;
  lastPurchase: string;
}

interface SegmentData {
  name: string;
  count: number;
  revenue: number;
  avgRisk: number;
  icon: string;
  color: string;
  customers: Customer[];
}

interface KPIData {
  totalCustomers: number;
  totalRevenue: number;
  avgRevenue: number;
  avgChurnRisk: number;
  segmentDistribution: Array<{ segment_name: string; count: number }>;
  lastUpdated: string;
}

export const CustomerDashboard: React.FC = () => {
  const [segments, setSegments] = useState<SegmentData[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<SegmentData | null>(null);
  const [kpis, setKPIs] = useState<KPIData | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [aiSuggestion, setAISuggestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showMetrics, setShowMetrics] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [contextualQuestions, setContextualQuestions] = useState<string[]>([]);

  const renderSegmentIcon = (iconName: string, color: string) => {
    const iconProps = { className: "w-8 h-8", fill: "currentColor", viewBox: "0 0 20 20", style: { color } };
    
    switch (iconName) {
      case 'crown':
        return (
          <svg {...iconProps}>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      case 'check-circle':
        return (
          <svg {...iconProps}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'exclamation-triangle':
        return (
          <svg {...iconProps}>
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'pause-circle':
        return (
          <svg {...iconProps}>
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg {...iconProps}>
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
        );
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch real KPI data
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-api-id.execute-api.us-east-1.amazonaws.com/dev';
      const kpiResponse = await fetch(`${API_BASE_URL}/api/dashboard/kpis`);
      const realKPIs = await kpiResponse.json();
      
      console.log('Real KPI data:', realKPIs);
      
      // Mock segment data with customers
      const mockSegments: SegmentData[] = [
        {
          name: 'VIP',
          count: 12,
          revenue: 156000,
          avgRisk: 0.08,
          icon: 'crown',
          color: colors.primary, // Purple for VIP
          customers: [
            {
              id: 'cust-001',
              name: 'David Kim',
              email: 'david.kim@business.com',
              totalSpent: 8500,
              churnRisk: 0.05,
              segment: 'VIP',
              lifecycleStage: 'VIP',
              lastPurchase: '2024-09-30'
            },
            {
              id: 'cust-006',
              name: 'Sarah Wilson',
              email: 'sarah.wilson@corp.com',
              totalSpent: 6200,
              churnRisk: 0.12,
              segment: 'VIP',
              lifecycleStage: 'VIP',
              lastPurchase: '2024-10-01'
            }
          ]
        },
        {
          name: 'Active',
          count: 45,
          revenue: 89000,
          avgRisk: 0.18,
          icon: 'check-circle',
          color: colors.primary, // Green for Active
          customers: [
            {
              id: 'cust-003',
              name: 'Mike Johnson',
              email: 'mike.johnson@email.com',
              totalSpent: 1200,
              churnRisk: 0.25,
              segment: 'Active',
              lifecycleStage: 'Active',
              lastPurchase: '2024-09-20'
            }
          ]
        },
        {
          name: 'At-Risk',
          count: 23,
          revenue: 34000,
          avgRisk: 0.35,
          icon: 'exclamation-triangle',
          color: colors.primary, // Orange for At-Risk
          customers: [
            {
              id: 'cust-002',
              name: 'Lisa Thompson',
              email: 'lisa.thompson@newbie.com',
              totalSpent: 450,
              churnRisk: 0.30,
              segment: 'At-Risk',
              lifecycleStage: 'New',
              lastPurchase: '2024-08-15'
            },
            {
              id: 'cust-007',
              name: 'Bob Martinez',
              email: 'bob.martinez@email.com',
              totalSpent: 890,
              churnRisk: 0.45,
              segment: 'At-Risk',
              lifecycleStage: 'Active',
              lastPurchase: '2024-07-20'
            }
          ]
        },
        {
          name: 'Dormant',
          count: 8,
          revenue: 2000,
          avgRisk: 0.75,
          icon: 'pause-circle',
          color: colors.primary, // Muted gray for Dormant
          customers: [
            {
              id: 'cust-005',
              name: 'Robert Chen',
              email: 'robert.chen@email.com',
              totalSpent: 150,
              churnRisk: 0.80,
              segment: 'Dormant',
              lifecycleStage: 'Dormant',
              lastPurchase: '2024-06-10'
            }
          ]
        }
      ];

      setKPIs(realKPIs);
      setSegments(mockSegments);
      
      // Generate AI suggestion
      const atRiskSegment = mockSegments.find(s => s.name === 'At-Risk');
      if (atRiskSegment && atRiskSegment.customers.length > 0) {
        setAISuggestion(`I've identified ${atRiskSegment.count} at-risk customers generating $${(atRiskSegment.revenue/1000).toFixed(0)}K revenue. ${atRiskSegment.customers[0].name} needs immediate attention with ${Math.round(atRiskSegment.customers[0].churnRisk * 100)}% churn risk. Shall I create a retention campaign?`);
      }

      // Set initial contextual questions
      updateContextualQuestions();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Fallback to mock data
      setKPIs({
        totalCustomers: 88,
        totalRevenue: 281000,
        avgRevenue: 3193,
        avgChurnRisk: 0.24,
        segmentDistribution: [
          { segment_name: 'VIP', count: 12 },
          { segment_name: 'Active', count: 45 },
          { segment_name: 'At-Risk', count: 23 },
          { segment_name: 'Dormant', count: 8 }
        ],
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateContextualQuestions = () => {
    let questions = ['Show me customer insights', 'Analyze segment performance', 'Create marketing campaign'];
    
    if (selectedCustomer) {
      questions = [
        `Why is ${selectedCustomer.name} at risk?`,
        `What's ${selectedCustomer.name}'s purchase history?`,
        `Create retention plan for ${selectedCustomer.name}`
      ];
    } else if (selectedSegment) {
      questions = [
        `Analyze ${selectedSegment.name} segment trends`,
        `Show top customers in ${selectedSegment.name}`,
        `Create campaign for ${selectedSegment.name} customers`
      ];
    }
    
    setContextualQuestions(questions);
  };

  const handleSegmentClick = (segment: SegmentData) => {
    setSelectedSegment(segment);
    updateContextualQuestions();
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    updateContextualQuestions();
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      console.log('Chat input:', chatInput);
      // TODO: Process chat input
      setChatInput('');
    }
  };

  const handleQuestionClick = (question: string) => {
    setChatInput(question);
  };

  const handleVoiceCommand = (command: string) => {
    console.log('Voice command:', command);
    // TODO: Process voice commands
  };

  const handleBulkAction = (action: string) => {
    if (selectedSegment) {
      console.log(`Bulk ${action} for ${selectedSegment.name} segment`);
      // TODO: Implement bulk actions
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.primary }}></div>
          <p style={{ color: colors.textSecondary }}>Loading Customer Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.background }}>
      {/* Side Navbar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} border-r flex flex-col transition-all duration-300 relative group`} style={{ backgroundColor: colors.primary, borderColor: colors.border }}>
        <div className="p-4 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <div>
              <h1 className="text-lg font-bold flex items-center text-white">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Scudo Workspace
              </h1>
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <div className="w-10 h-10 flex items-center justify-center">
                <svg className="sidebar-nav-icon collapsed" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'white' }}>
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
        </div>
        
        {/* Toggle button on the edge - only visible on hover */}
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-4 bg-white border rounded-full p-1 shadow-md hover:shadow-lg transition-all duration-200 z-10 opacity-0 group-hover:opacity-100"
          style={{ borderColor: colors.border }}
        >
          {sidebarCollapsed ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.primary }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.primary }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
        
        <nav className="flex-1 px-4">
          <div className="space-y-2">
            <div className={`${sidebarCollapsed ? 'flex justify-center w-full' : ''}`}>
              <div className={`${sidebarCollapsed ? 'flex justify-center items-center justify-center rounded-lg w-10 h-10 tooltip' : 'p-2 rounded-2xl flex items-center'} cursor-pointer`} style={{ backgroundColor: colors.primaryLight }} data-tooltip={sidebarCollapsed ? "Dashboard" : ""}>
                <svg className={`sidebar-nav-icon ${sidebarCollapsed ? 'collapsed' : ''}`} fill="currentColor" viewBox="0 0 20 20" style={{ color: colors.primary }}>
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                {!sidebarCollapsed && (
                  <span className="text-sm ml-2" style={{ color: colors.primary }}>Dashboard</span>
                )}
              </div>
            </div>
            <div className={`${sidebarCollapsed ? 'flex justify-center w-full items-center justify-center w-10 h-10 tooltip' : 'p-2 rounded cursor-pointer hover:bg-opacity-20 flex items-center'}`} style={{ color: colors.textMuted }} data-tooltip={sidebarCollapsed ? "Customers" : ""}>
              <svg className={`sidebar-nav-icon ${sidebarCollapsed ? 'collapsed' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              {!sidebarCollapsed && (
                <span className="text-sm ml-2">Customers</span>
              )}
            </div>
            <div className={`${sidebarCollapsed ? 'flex justify-center w-full items-center justify-center w-10 h-10 tooltip' : 'p-2 rounded cursor-pointer hover:bg-opacity-20 flex items-center'}`} style={{ color: colors.textMuted }} data-tooltip={sidebarCollapsed ? "Analytics" : ""}>
              <svg className={`sidebar-nav-icon ${sidebarCollapsed ? 'collapsed' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              {!sidebarCollapsed && (
                <span className="text-sm ml-2">Analytics</span>
              )}
            </div>
            <div className={`${sidebarCollapsed ? 'flex justify-center w-full items-center justify-center w-10 h-10 tooltip' : 'p-2 rounded cursor-pointer hover:bg-opacity-20 flex items-center'}`} style={{ color: colors.textMuted }} data-tooltip={sidebarCollapsed ? "Settings" : ""}>
              <svg className={`sidebar-nav-icon ${sidebarCollapsed ? 'collapsed' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              {!sidebarCollapsed && (
                <span className="text-sm ml-2">Settings</span>
              )}
            </div>
          </div>
        </nav>
        
        {/* Key Metrics in Sidebar */}
        {kpis && !sidebarCollapsed && (
          <div className="px-4 pb-4">
            <div className="text-xs font-medium mb-2 text-white opacity-75">Key Metrics</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white bg-opacity-100 rounded p-2">
                <div className="text-lg font-bold text-dark">{kpis.totalCustomers}</div>
                <div className="text-xs text-dark opacity-75">Total Customers</div>
              </div>
              <div className="bg-white bg-opacity-100 rounded p-2">
                <div className="text-lg font-bold text-white" style={{ color: colors.primary2 }}>${Math.round(kpis.totalRevenue / 1000)}K</div>
                <div className="text-xs text-white opacity-75" style={{ color: colors.primary2 }}>Total Revenue</div>
              </div>
              <div className="bg-white bg-opacity-100 rounded p-2">
                <div className="text-lg font-bold text-white" style={{ color: colors.primary2 }}>${Math.round(kpis.avgRevenue)}</div>
                <div className="text-xs text-white opacity-75" style={{ color: colors.primary2 }}>Avg Revenue</div>
              </div>
              <div className="bg-white bg-opacity-100 rounded p-2">
                <div className="text-lg font-bold text-white" style={{ color: colors.primary3 }}>{Math.round(kpis.avgChurnRisk * 100)}%</div>
                <div className="text-xs text-white opacity-75" style={{ color: colors.primary2 }}>Avg Churn Risk</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Dashboard Area */}
        <div className="flex-1 p-6 relative">
          {/* Insights Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center" style={{ color: colors.primary }}>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Insights
            </h2>
            <div className="bg-white rounded-lg shadow-sm border p-4" style={{ borderColor: colors.border }}>
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 mt-1" fill="currentColor" viewBox="0 0 20 20" style={{ color: colors.primary }}>
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm" style={{ color: colors.primary }}>
                    {aiSuggestion}
                  </p>
                  <div className="flex space-x-2 mt-3">
                    <button 
                      className="px-3 py-1 text-xs rounded"
                      style={{ backgroundColor: colors.primary, color: colors.surface }}
                    >
                      Create Campaign
                    </button>
                    <button 
                      className="px-3 py-1 text-xs rounded border"
                      style={{ borderColor: colors.warning, backgroundColor: colors.warning, color: colors.surface }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Segment Overview */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center" style={{ color: colors.primary }}>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Segment Overview
            </h2>
            <div className="grid grid-cols-4 gap-4">
              {segments.map((segment) => (
                <div
                  key={segment.name}
                  className="bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow"
                  style={{ borderColor: selectedSegment?.name === segment.name ? segment.color : colors.border }}
                  onClick={() => handleSegmentClick(segment)}
                >
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      {renderSegmentIcon(segment.icon, segment.color)}
                    </div>
                    <div className="font-semibold" style={{ color: segment.color }}>
                      {segment.name}
                    </div>
                    <div className="text-lg font-bold" style={{ color: colors.primary }}>
                      {segment.count}
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      ${(segment.revenue / 1000).toFixed(0)}K
                    </div>
                    <button 
                      className="mt-2 px-3 py-1 text-xs rounded border"
                      style={{ borderColor: segment.color, color: segment.color }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Segment Details */}
          {selectedSegment && (
            <div className="bg-white rounded-lg shadow-sm border p-6" style={{ borderColor: selectedSegment.color }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: colors.primary }}>
                  {selectedSegment.name} Customers ({selectedSegment.count})
                </h3>
                <button 
                  className="text-sm px-3 py-1 rounded"
                  style={{ backgroundColor: colors.primaryDark, color: colors.surface }}
                  onClick={() => setSelectedSegment(null)}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {selectedSegment.customers.slice(0, 3).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <span className="font-medium" style={{ color: colors.primary }}>
                        {customer.name}
                      </span>
                      <span className="text-sm ml-2" style={{ color: colors.textSecondary }}>
                        ${customer.totalSpent} • {Math.round(customer.churnRisk * 100)}% risk
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <button className="px-2 py-1 text-xs rounded flex items-center" style={{ backgroundColor: colors.success, color: colors.surface }}>
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </button>
                      <button className="px-2 py-1 text-xs rounded flex items-center" style={{ backgroundColor: colors.success, color: colors.surface }}>
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3 mt-4">
                <button 
                  className="px-4 py-2 rounded flex items-center"
                  style={{ backgroundColor: colors.primary, color: colors.surface }}
                  onClick={() => handleBulkAction('email')}
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Bulk Email
                </button>
                <button 
                  className="px-4 py-2 rounded flex items-center"
                  style={{ backgroundColor: colors.primary, color: colors.surface }}
                  onClick={() => handleBulkAction('call')}
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Call Campaign
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scudo Intelligence Chat */}
        {!chatCollapsed && (
          <div className="w-2/5 border-l flex flex-col transition-all duration-300" style={{ 
            borderColor: colors.border, 
            backgroundColor: colors.surface
          }}>
            <div className="p-4 flex items-center justify-between" style={{ 
              backgroundColor: colors.primary
            }}>
              <h3 className="font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Scudo Intelligence
              </h3>
              <button 
                onClick={() => setChatCollapsed(true)}
                className="p-1 rounded hover:bg-opacity-20 text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
            {selectedCustomer && (
              <div className="bg-white p-3 mb-4 border" style={{ 
                borderRadius: '16px',
                borderColor: colors.border
              }}>
                <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  {selectedCustomer.name}
                </div>
                <div className="text-xs flex items-center mt-1" style={{ color: colors.textSecondary }}>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  {selectedCustomer.email}
                </div>
                <div className="text-xs flex items-center mt-1" style={{ color: colors.textSecondary }}>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  +1 (555) 123-4567
                </div>
                <div className="text-xs mt-1" style={{ color: colors.warning }}>
                  {Math.round(selectedCustomer.churnRisk * 100)}% churn risk
                </div>
              </div>
            )}

            {/* Contextual Questions */}
            <div className="mb-4">
              <div className="text-sm font-medium mb-2 flex items-center" style={{ color: colors.primary }}>
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Suggested Questions:
              </div>
              <div className="space-y-2">
                {contextualQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionClick(question)}
                    className="w-full text-left p-2 text-sm border hover:bg-gray-50 transition-colors"
                    style={{ 
                      borderColor: colors.border, 
                      color: colors.primary,
                      borderRadius: '12px'
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Input - Unified */}
          <div className="p-4">
            <form onSubmit={handleChatSubmit}>
              <div className="flex bg-white border rounded-lg" style={{ borderColor: colors.border }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask me anything about your customers..."
                  className="flex-1 p-3 text-sm bg-transparent border-none outline-none"
                />
                <button
                  type="submit"
                  className="p-3 flex items-center justify-center"
                  style={{ 
                    backgroundColor: colors.primary, 
                    color: colors.surface,
                    borderRadius: '0 6px 6px 0'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                </button>
              </div>
              <p className="text-xs mt-2 text-center" style={{ color: colors.primary }}>
                Scudo uses AI. Please verify important information.
              </p>
            </form>
          </div>
        </div>
        )}
        
        {/* Floating chat icon when collapsed */}
        {chatCollapsed && (
          <button 
            onClick={() => setChatCollapsed(false)}
            className="fixed right-4 top-4 bg-white border rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow z-50"
            style={{ borderColor: colors.border, backgroundColor: colors.primary }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'white' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
