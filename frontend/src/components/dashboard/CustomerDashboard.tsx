import React, { useState, useEffect } from 'react';
import { AICompanion } from './AICompanion';
import { VoiceInterface } from './VoiceInterface';
import { useWebSocket } from '../../hooks/useWebSocket';
import { marked } from 'marked';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Collapsed by default
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [contextualQuestions, setContextualQuestions] = useState<string[]>([]);
  const [insightsMinimized, setInsightsMinimized] = useState(false);
  
  // WebSocket integration for daily briefing
  const { isConnected, isConnecting, lastMessage, sendMessage, error } = useWebSocket();
  const [briefingStatus, setBriefingStatus] = useState<'idle' | 'loading' | 'complete' | 'error'>('idle');
  const [briefingData, setBriefingData] = useState<any>(null);

  // Load persisted briefing on mount
  useEffect(() => {
    const savedBriefing = localStorage.getItem('daily_briefing_data');
    const savedStatus = localStorage.getItem('daily_briefing_status');
    const savedTimestamp = localStorage.getItem('daily_briefing_timestamp');
    
    if (savedBriefing && savedStatus && savedTimestamp) {
      const timestamp = new Date(savedTimestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
      
      // Use cached briefing if less than 1 hour old
      if (hoursDiff < 1) {
        console.log('Loading cached daily briefing');
        setBriefingData(JSON.parse(savedBriefing));
        setBriefingStatus(savedStatus as any);
      } else {
        console.log('Cached briefing expired, will generate new one');
        localStorage.removeItem('daily_briefing_data');
        localStorage.removeItem('daily_briefing_status');
        localStorage.removeItem('daily_briefing_timestamp');
      }
    }
  }, []);

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

  // Auto-trigger daily briefing on WebSocket connection
  useEffect(() => {
    if (isConnected && (briefingStatus === 'idle' || briefingStatus === 'error')) {
      console.log('WebSocket connected, triggering daily briefing...');
      setBriefingStatus('loading');
      localStorage.setItem('daily_briefing_status', 'loading');
      localStorage.setItem('daily_briefing_timestamp', new Date().toISOString());
      sendMessage({ input: 'Generate daily briefing' });
    }
  }, [isConnected, briefingStatus, sendMessage]);

  // Handle WebSocket responses
  useEffect(() => {
    if (lastMessage) {
      console.log('Received WebSocket message:', lastMessage);
      
      try {
        let messageContent = '';
        
        if (typeof lastMessage === 'string') {
          messageContent = lastMessage;
        } else if (lastMessage.content) {
          messageContent = lastMessage.content;
        } else if (lastMessage.chat_response) {
          messageContent = lastMessage.chat_response;
        } else if (lastMessage.message) {
          messageContent = lastMessage.message;
        }
        
        console.log('Processing message content:', messageContent);
        
        if (messageContent.includes('briefing_text') && messageContent.includes('context_actions')) {
          try {
            const briefingResponse = JSON.parse(messageContent);
            console.log('=== BRIEFING DATA DEBUG ===');
            console.log('Full briefing response:', briefingResponse);
            console.log('Summary stats:', briefingResponse.summary_stats);
            console.log('Urgent count:', briefingResponse.summary_stats?.urgent_count);
            console.log('Opportunities count:', briefingResponse.summary_stats?.opportunities_count);
            console.log('Trends count:', briefingResponse.summary_stats?.trends_count);
            console.log('=== END DEBUG ===');
            
            setBriefingData(briefingResponse);
            setBriefingStatus('complete');
            
            localStorage.setItem('daily_briefing_data', JSON.stringify(briefingResponse));
            localStorage.setItem('daily_briefing_status', 'complete');
            localStorage.setItem('daily_briefing_timestamp', new Date().toISOString());
            
            console.log('Daily briefing complete:', briefingResponse);
          } catch (parseError) {
            console.error('Failed to parse briefing JSON:', parseError);
            const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                const briefingResponse = JSON.parse(jsonMatch[0]);
                console.log('=== EXTRACTED BRIEFING DATA DEBUG ===');
                console.log('Full briefing response:', briefingResponse);
                console.log('Summary stats:', briefingResponse.summary_stats);
                console.log('Urgent count:', briefingResponse.summary_stats?.urgent_count);
                console.log('Opportunities count:', briefingResponse.summary_stats?.opportunities_count);
                console.log('Trends count:', briefingResponse.summary_stats?.trends_count);
                console.log('=== END EXTRACTED DEBUG ===');
                
                setBriefingData(briefingResponse);
                setBriefingStatus('complete');
                
                localStorage.setItem('daily_briefing_data', JSON.stringify(briefingResponse));
                localStorage.setItem('daily_briefing_status', 'complete');
                localStorage.setItem('daily_briefing_timestamp', new Date().toISOString());
                
                console.log('Daily briefing complete (extracted):', briefingResponse);
              } catch (extractError) {
                console.error('Failed to extract JSON:', extractError);
                setBriefingStatus('error');
              }
            } else {
              setBriefingStatus('error');
            }
          }
        } else if (messageContent.includes('error') || messageContent.includes('failed')) {
          console.error('Backend error:', messageContent);
          setBriefingStatus('error');
        } else {
          console.log('Briefing progress:', messageContent);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
  }, [lastMessage]);

  // Handle WebSocket errors
  useEffect(() => {
    if (error && briefingStatus === 'loading') {
      setBriefingStatus('error');
      console.error('WebSocket error during briefing:', error);
    }
  }, [error, briefingStatus]);

  // Comprehensive field mapping for inconsistent agent responses
  const getSafeCount = (data: any, field: string): number => {
    if (!data || !data.summary_stats) return 0;
    
    const stats = data.summary_stats;
    
    // Direct match first (for consistent responses)
    if (stats[field] !== undefined) {
      const value = stats[field];
      return typeof value === 'number' ? value : parseInt(value) || 0;
    }
    
    // Handle specific field mappings based on actual agent responses
    if (field === 'urgent_count') {
      // Try multiple possible field names
      const urgentFields = ['urgent_count', 'high_churn_count', 'critical_count', 'risk_count'];
      for (const fieldName of urgentFields) {
        if (stats[fieldName] !== undefined) {
          const value = stats[fieldName];
          return typeof value === 'number' ? value : parseInt(value) || 0;
        }
      }
      return 0;
    }
    
    if (field === 'opportunities_count') {
      // Try direct field first, then calculate from segments
      if (stats.opportunities_count !== undefined) {
        const value = stats.opportunities_count;
        return typeof value === 'number' ? value : parseInt(value) || 0;
      }
      
      // Calculate from segment breakdown if available
      if (stats.segment_breakdown) {
        const segments = stats.segment_breakdown;
        return (segments.VIP || 0) + (segments.Premium || 0);
      }
      
      return 0;
    }
    
    if (field === 'trends_count') {
      // Try direct field first
      if (stats.trends_count !== undefined) {
        const value = stats.trends_count;
        return typeof value === 'number' ? value : parseInt(value) || 0;
      }
      
      // For responses without trends_count, return 1 if there's meaningful data
      if (stats.total_customers || stats.segment_breakdown || stats.revenue_concentration) {
        return 1;
      }
      
      return 0;
    }
    
    return 0;
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch real KPI data
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-api-id.execute-api.us-east-1.amazonaws.com/dev';
      const kpiResponse = await fetch(`${API_BASE_URL}/api/dashboard/kpis`);
      const realKPIs = await kpiResponse.json();
      
      console.log('Real KPI data:', realKPIs);
      
      // Fetch real segment data
      const segmentResponse = await fetch(`${API_BASE_URL}/api/dashboard/segments`);
      const realSegments = await segmentResponse.json();
      
      console.log('Real Segment data:', realSegments);
      
      // Map API response to frontend format
      const segmentData: SegmentData[] = realSegments.segments?.map((segment: any) => ({
        name: segment.name,
        count: segment.count,
        revenue: segment.revenue,
        avgRisk: segment.avgRisk,
        icon: segment.icon,
        color: segment.color,
        customers: [] // Will be populated when segment is clicked
      })) || [];

      setKPIs(realKPIs);
      setSegments(segmentData);
      
      
      
      
      // Generate AI suggestion based on live data
      if (segmentData.length > 0) {
        const highRiskSegment = segmentData.find(s => s.avgRisk > 0.5);
        if (highRiskSegment) {
          setAISuggestion(`I've identified ${highRiskSegment.count} customers in ${highRiskSegment.name} segment with ${Math.round(highRiskSegment.avgRisk * 100)}% average risk generating $${(highRiskSegment.revenue/1000).toFixed(0)}K revenue. Shall I create a retention campaign?`);
        } else {
          setAISuggestion(`Your segments are performing well! ${segmentData[0]?.name} segment has ${segmentData[0]?.count} customers with low ${Math.round((segmentData[0]?.avgRisk || 0) * 100)}% risk.`);
        }
      }

      // Set initial contextual questions
      updateContextualQuestions();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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

  const handleRerunBriefing = () => {
    setBriefingStatus('idle');
    setBriefingData(null);
    localStorage.removeItem('daily_briefing_data');
    localStorage.removeItem('daily_briefing_status');
    localStorage.removeItem('daily_briefing_timestamp');
    
    if (isConnected) {
      setBriefingStatus('loading');
      localStorage.setItem('daily_briefing_status', 'loading');
      localStorage.setItem('daily_briefing_timestamp', new Date().toISOString());
      sendMessage({ input: 'Generate daily briefing' });
    }
  };

  const handleActionClick = (action: any) => {
    console.log('Action clicked:', action);
    
    switch (action.action) {
      case 'send_email':
        alert(`Sending email to ${action.params?.customer_email || 'customer'}`);
        break;
      case 'create_promotion':
        alert(`Creating ${action.params?.promotion_type || 'promotion'} for ${action.params?.target_segment || 'customers'}`);
        break;
      case 'show_customer_segments':
        alert('Showing detailed customer analytics');
        break;
      default:
        console.log('Unknown action type:', action.action);
    }
  };

  const handleSegmentClick = (segment: SegmentData) => {
    setSelectedSegment(segment);
    setSelectedCustomer(null);
    setChatCollapsed(false);
    
    const questions = [
      `Analyze ${segment.name} segment trends`,
      `Show top customers in ${segment.name}`,
      `Create campaign for ${segment.name} customers`
    ];
    setContextualQuestions(questions);
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    
    const questions = [
      `Why is ${customer.name} at risk?`,
      `What's ${customer.name}'s purchase history?`,
      `Create retention plan for ${customer.name}`
    ];
    setContextualQuestions(questions);
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
                <svg className="w-10 h-10 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Scudo Workspace
              </h1>
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <div className="w-10 h-10 flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'white' }}>
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
              <div className={`${sidebarCollapsed ? 'flex justify-center items-center justify-center rounded-full tooltip' : 'p-2 rounded-2xl flex items-center'} cursor-pointer`} style={{ backgroundColor: colors.primaryLight, ...(sidebarCollapsed && { width: '30px', height: '30px' }) }} data-tooltip={sidebarCollapsed ? "Dashboard" : ""}>
                <svg className={`sidebar-nav-icon ${sidebarCollapsed ? 'collapsed' : ''}`} fill="currentColor" viewBox="0 0 20 20" style={{ color: colors.primary }}>
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                {!sidebarCollapsed && (
                  <span className="text-sm ml-2" style={{ color: colors.primary }}>Dashboard</span>
                )}
              </div>
            </div>
            <div className={`${sidebarCollapsed ? 'flex justify-center w-full' : ''}`}>
              <div className={`${sidebarCollapsed ? 'flex justify-center items-center rounded-full tooltip' : 'p-2 rounded cursor-pointer hover:bg-opacity-20 flex items-center'}`} style={{ color: colors.textMuted, ...(sidebarCollapsed && { width: '30px', height: '30px' }) }} data-tooltip={sidebarCollapsed ? "Customers" : ""}>
                <svg className={`sidebar-nav-icon ${sidebarCollapsed ? 'collapsed' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                {!sidebarCollapsed && (
                  <span className="text-sm ml-2">Customers</span>
                )}
              </div>
            </div>
            <div className={`${sidebarCollapsed ? 'flex justify-center w-full' : ''}`}>
              <div className={`${sidebarCollapsed ? 'flex justify-center items-center rounded-full tooltip' : 'p-2 rounded cursor-pointer hover:bg-opacity-20 flex items-center'}`} style={{ color: colors.textMuted, ...(sidebarCollapsed && { width: '30px', height: '30px' }) }} data-tooltip={sidebarCollapsed ? "Analytics" : ""}>
                <svg className={`sidebar-nav-icon ${sidebarCollapsed ? 'collapsed' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                {!sidebarCollapsed && (
                  <span className="text-sm ml-2">Analytics</span>
                )}
              </div>
            </div>
            <div className={`${sidebarCollapsed ? 'flex justify-center w-full' : ''}`}>
              <div className={`${sidebarCollapsed ? 'flex justify-center items-center rounded-full tooltip' : 'p-2 rounded cursor-pointer hover:bg-opacity-20 flex items-center'}`} style={{ color: colors.textMuted, ...(sidebarCollapsed && { width: '30px', height: '30px' }) }} data-tooltip={sidebarCollapsed ? "Settings" : ""}>
                <svg className={`sidebar-nav-icon ${sidebarCollapsed ? 'collapsed' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                {!sidebarCollapsed && (
                  <span className="text-sm ml-2">Settings</span>
                )}
              </div>
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
        
        {/* WebSocket Connection Status */}
        <div className="px-4 pb-4 mt-auto">
          <div className={`${sidebarCollapsed ? 'flex justify-center w-full' : ''}`}>
            <div className={`${sidebarCollapsed ? 'flex justify-center items-center rounded-full tooltip' : 'p-2 rounded cursor-pointer flex items-center'}`} 
                 style={{ color: colors.textMuted, ...(sidebarCollapsed && { width: '30px', height: '30px' }) }} 
                 data-tooltip={sidebarCollapsed ? (isConnected ? 'Online' : isConnecting ? 'Connecting...' : 'Offline') : ""}>
              <svg className={`sidebar-nav-icon ${sidebarCollapsed ? 'collapsed' : ''}`} fill="currentColor" viewBox="0 0 20 20" 
                   style={{ color: isConnected ? '#10B981' : isConnecting ? '#F59E0B' : '#EF4444' }}>
                <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.24 0 1 1 0 01-1.415-1.415 5 5 0 017.07 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              {!sidebarCollapsed && (
                <span className="text-sm ml-2">
                  System: {isConnected ? 'Online' : isConnecting ? 'Connecting...' : 'Offline'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex h-screen">
        {/* Dashboard Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Daily Insights Section - Enhanced */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center" style={{ color: colors.primary }}>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Daily Insights
              {/* {briefingStatus === 'loading' && (
                <div className="ml-2 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: colors.primary }}></div>
                  <span className="ml-2 text-sm" style={{ color: colors.textSecondary }}>Analyzing...</span> 
                </div>
              )} */}
            </h2>
            <div className="bg-white rounded-lg shadow-sm border p-4" style={{ borderColor: colors.border }}>
              {/* Always visible top row with content and buttons */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {!insightsMinimized ? (
                    <>
                      {briefingStatus === 'loading' && (
                        <div className="flex items-start space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 mt-1" style={{ borderColor: colors.primary }}></div>
                          <div className="flex-1">
                            {/* <p className="text-sm" style={{ color: colors.primary }}> */}
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
</svg>Generating your daily business briefing...
                            {/* </p> */}
                            <div className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                              • Analyzing customer data<br/>
                              • Identifying urgent actions<br/>
                              • Finding opportunities
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                     <div className="text-center py-2">
                      
                      <div className="flex items-center justify-center space-x-8">
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: colors.danger }}
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <div 
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: colors.primary }}
                          >
                            {getSafeCount(briefingData, 'urgent_count')}
                          </div>
                        </div>
                        <span className="text-xs font-medium" style={{ color: colors.danger }}>Urgent</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: colors.success }}
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div 
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: colors.primary }}
                          >
                            {getSafeCount(briefingData, 'opportunities_count')}
                          </div>
                        </div>
                        <span className="text-xs font-medium" style={{ color: colors.success }}>Opportunities</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: colors.primary }}
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div 
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: colors.primary }}
                          >
                            {getSafeCount(briefingData, 'trends_count')}
                          </div>
                        </div>
                        <span className="text-xs font-medium" style={{ color: colors.primary }}>Trends</span>
                      </div>
                    </div>
                    </div>
                      {/* {briefingData.summary_stats && (
                        
                          <div className="flex items-center justify-around">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div 
                                  className="w-12 h-12 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: colors.danger }}
                                >
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                  </svg>
                                </div>
                                <div 
                                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                  style={{ backgroundColor: colors.primary }}
                                >
                                  {getSafeCount(briefingData, 'urgent_count')}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium" style={{ color: colors.danger }}>Urgent</div>
                                <div className="text-xs" style={{ color: colors.textSecondary }}>Immediate Action</div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div 
                                  className="w-12 h-12 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: colors.success }}
                                >
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                </div>
                                <div 
                                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                  style={{ backgroundColor: colors.primary }}
                                >
                                  {getSafeCount(briefingData, 'opportunities_count')}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium" style={{ color: colors.success }}>Opportunities</div>
                                <div className="text-xs" style={{ color: colors.textSecondary }}>Revenue Growth</div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div 
                                  className="w-12 h-12 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: colors.primary }}
                                >
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <div 
                                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                  style={{ backgroundColor: colors.primary }}
                                >
                                  {getSafeCount(briefingData, 'trends_count')}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium" style={{ color: colors.primary }}>Trends</div>
                                <div className="text-xs" style={{ color: colors.textSecondary }}>Market Insights</div>
                              </div>
                            </div>
                          </div>
                        
                      )} */}
                    </>
                  )}
                </div>
                
                {/* Always visible buttons */}
                <div className="flex items-center space-x-1 ml-4">
                  <button 
                    onClick={handleRerunBriefing}
                    className="p-1 rounded hover:bg-gray-100" 
                    title="Refresh insights"
                    disabled={briefingStatus === 'loading'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: briefingStatus === 'loading' ? colors.textSecondary : colors.primary }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => setInsightsMinimized(!insightsMinimized)}
                    className="p-1 rounded hover:bg-gray-100" 
                    title={insightsMinimized ? "Expand insights" : "Minimize insights"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.primary }}>
                      {insightsMinimized ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>
              
              {!insightsMinimized && (
                <>
                  {briefingStatus === 'complete' && briefingData && (
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: colors.success }}>
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <div 
                            className="text-sm leading-relaxed prose prose-sm max-w-none" 
                            style={{ color: colors.primary }}
                            dangerouslySetInnerHTML={{ 
                              __html: marked.parse(briefingData.briefing_text) as string 
                            }}
                          />
                        </div>
                      </div>
                      
                      {briefingData.summary_stats && (
                        
                          <div className="flex items-center justify-around">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div 
                                  className="w-12 h-12 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: colors.danger }}
                                >
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                  </svg>
                                </div>
                                <div 
                                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                  style={{ backgroundColor: colors.primary }}
                                >
                                  {getSafeCount(briefingData, 'urgent_count')}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium" style={{ color: colors.danger }}>Urgent</div>
                                <div className="text-xs" style={{ color: colors.textSecondary }}>Immediate Action</div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div 
                                  className="w-12 h-12 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: colors.success }}
                                >
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                </div>
                                <div 
                                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                  style={{ backgroundColor: colors.primary }}
                                >
                                  {getSafeCount(briefingData, 'opportunities_count')}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium" style={{ color: colors.success }}>Opportunities</div>
                                <div className="text-xs" style={{ color: colors.textSecondary }}>Revenue Growth</div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div 
                                  className="w-12 h-12 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: colors.primary }}
                                >
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <div 
                                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                  style={{ backgroundColor: colors.primary }}
                                >
                                  {getSafeCount(briefingData, 'trends_count')}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium" style={{ color: colors.primary }}>Trends</div>
                                <div className="text-xs" style={{ color: colors.textSecondary }}>Market Insights</div>
                              </div>
                            </div>
                          </div>
                        
                      )}
                      
                      {briefingData.context_actions && briefingData.context_actions.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                            Recommended Actions:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {briefingData.context_actions.map((action: any, index: number) => {
                              const getPriorityStyle = (priority: string) => {
                                switch (priority) {
                                  case 'urgent':
                                    return {
                                      backgroundColor: colors.primary3,
                                      color: colors.surface,
                                      borderColor: colors.primary3
                                    };
                                  default:
                                    return {
                                      backgroundColor: colors.primary,
                                      color: colors.surface,
                                      borderColor: colors.primary
                                    };
                                }
                              };

                              const getPriorityIcon = (priority: string) => {
                                switch (priority) {
                                  case 'urgent':
                                    return (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                      </svg>
                                    );
                                  case 'high':
                                    return (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                      </svg>
                                    );
                                  default:
                                    return (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                      </svg>
                                    );
                                }
                              };
                              
                              const priorityStyle = getPriorityStyle(action.priority);
                              
                              return (
                                <button 
                                  key={index}
                                  className="px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-md"
                                  style={{
                                    backgroundColor: priorityStyle.backgroundColor,
                                    color: priorityStyle.color,
                                    borderColor: priorityStyle.borderColor
                                  }}
                                  onClick={() => handleActionClick(action)}
                                  title={`${action.action} - ${action.priority} priority`}
                                >
                                  <div className="flex items-center space-x-2">
                                    {getPriorityIcon(action.priority)}
                                    <span>{action.label}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {briefingStatus === 'error' && (
                    <div className="flex items-start space-x-3">
                      <svg className="w-6 h-6 mt-1" fill="currentColor" viewBox="0 0 20 20" style={{ color: colors.danger }}>
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm" style={{ color: colors.danger }}>
                          {isConnected 
                            ? "Failed to generate daily briefing. The analysis service encountered an error." 
                            : "Failed to generate daily briefing. Please check your connection."
                          }
                        </p>
                        <button 
                          className="text-xs mt-2 px-2 py-1 rounded border"
                          style={{ borderColor: colors.primary, color: colors.primary }}
                          onClick={handleRerunBriefing}
                        >
                          {isConnected ? 'Retry Analysis' : 'Retry Connection'}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {briefingStatus === 'idle' && !isConnected && (
                    <div className="flex items-start space-x-3">
                      <div className="animate-pulse rounded-full h-6 w-6 bg-gray-300 mt-1"></div>
                      <div className="flex-1">
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          Connecting to generate your daily briefing...
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
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
            
            <div className="flex gap-6">
              {/* Compact Segments Grid */}
              <div className="w-1/2 flex items-center">
                <div className="grid grid-cols-4 gap-2 w-full">
                  {segments.map((segment) => (
                    <div
                      key={segment.name}
                      className={`rounded border p-2 cursor-pointer hover:shadow-sm transition-all text-center ${
                        selectedSegment?.name === segment.name ? 'ring-1 ring-offset-1' : 'bg-white'
                      }`}
                      style={{ 
                        borderColor: selectedSegment?.name === segment.name ? segment.color : colors.border,
                        backgroundColor: selectedSegment?.name === segment.name ? colors.primary : 'white'
                      }}
                      onClick={() => handleSegmentClick(segment)}
                    >
                      <div className="text-xs font-medium mb-1" style={{ 
                        color: selectedSegment?.name === segment.name ? colors.surface : segment.color 
                      }}>
                        {segment.name}
                      </div>
                      <div className="text-sm font-bold" style={{ 
                        color: selectedSegment?.name === segment.name ? colors.surface : colors.primary 
                      }}>
                        {segment.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Segment Detail Panel */}
              <div className="w-1/2">
                {selectedSegment ? (
                  <div className="bg-white rounded-lg shadow-sm border p-4" style={{ borderColor: colors.border }}>
                    <div className="flex items-center mb-4">
                      <div className="flex items-center mr-3">
                        {renderSegmentIcon(selectedSegment.icon, selectedSegment.color)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold" style={{ color: selectedSegment.color }}>
                          {selectedSegment.name} Segment
                        </h3>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          Detailed segment analysis
                        </p>
                      </div>
                    </div>

                    {/* Segment Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.surface }}>
                        <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                          {selectedSegment.count}
                        </div>
                        <div className="text-sm" style={{ color: colors.textSecondary }}>
                          Customers
                        </div>
                      </div>
                      <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.surface }}>
                        <div className="text-2xl font-bold" style={{ color: colors.success }}>
                          ${(selectedSegment.revenue/1000).toFixed(0)}K
                        </div>
                        <div className="text-sm" style={{ color: colors.textSecondary }}>
                          Revenue
                        </div>
                      </div>
                      <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.surface }}>
                        <div className="text-2xl font-bold" style={{ color: selectedSegment.avgRisk > 0.5 ? colors.danger : colors.success }}>
                          {Math.round(selectedSegment.avgRisk * 100)}%
                        </div>
                        <div className="text-sm" style={{ color: colors.textSecondary }}>
                          Avg Risk
                        </div>
                      </div>
                      <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.surface }}>
                        <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                          ${Math.round(selectedSegment.revenue / selectedSegment.count)}
                        </div>
                        <div className="text-sm" style={{ color: colors.textSecondary }}>
                          Avg Value
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        className="flex-1 px-3 py-2 rounded text-sm font-medium text-white"
                        style={{ backgroundColor: selectedSegment.color }}
                      >
                        View Customers
                      </button>
                      <button 
                        className="flex-1 px-3 py-2 rounded text-sm font-medium border"
                        style={{ borderColor: selectedSegment.color, color: selectedSegment.color }}
                      >
                        Create Campaign
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border p-8 text-center" style={{ borderColor: colors.border }}>
                    <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: colors.textMuted }}>
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    <h3 className="text-lg font-medium mb-2" style={{ color: colors.textMuted }}>
                      Select a Segment
                    </h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      Click on any segment to view detailed analytics and customer insights
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>

        
          
        </div>

        {/* Scudo Intelligence Chat */}
        {!chatCollapsed && (
          <div className="w-2/5 border-l flex flex-col h-screen" style={{ 
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
        
  )}