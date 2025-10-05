import React, { useState, useEffect } from 'react';

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

interface AICompanionProps {
  suggestion: string;
  selectedCustomer: Customer | null;
  colors: Record<string, string>;
}

interface AIMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  actions?: Array<{
    label: string;
    action: string;
    variant?: 'primary' | 'secondary' | 'success' | 'warning';
  }>;
}

export const AICompanion: React.FC<AICompanionProps> = ({
  suggestion,
  selectedCustomer,
  colors
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [contextualSuggestions, setContextualSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Initialize with welcome message
    if (messages.length === 0) {
      addAIMessage(
        "👋 Welcome to Scudo! I'm your AI companion. I'll help you understand your customers and suggest actions. What would you like to know?",
        [
          { label: "Show at-risk customers", action: "filter_at_risk", variant: "warning" },
          { label: "Analyze VIP segment", action: "analyze_vip", variant: "primary" },
          { label: "Customer overview", action: "overview", variant: "secondary" }
        ]
      );
    }
  }, []);

  useEffect(() => {
    // Add proactive suggestion when available
    if (suggestion && !messages.some(m => m.content.includes(suggestion))) {
      addAIMessage(suggestion, [
        { label: "Yes, create strategy", action: "create_strategy", variant: "primary" },
        { label: "Tell me more", action: "explain_more", variant: "secondary" },
        { label: "Not now", action: "dismiss", variant: "secondary" }
      ]);
    }
  }, [suggestion]);

  useEffect(() => {
    // Update contextual suggestions based on selected customer
    if (selectedCustomer) {
      const suggestions = [
        `Why is ${selectedCustomer.name} at ${Math.round(selectedCustomer.churnRisk * 100)}% churn risk?`,
        `How can I retain ${selectedCustomer.name}?`,
        `Show ${selectedCustomer.name}'s purchase history`,
        `Create campaign for ${selectedCustomer.segment.replace('_', ' ')} segment`
      ];
      setContextualSuggestions(suggestions);
    } else {
      setContextualSuggestions([
        "Show me VIP customers",
        "Which customers need attention?",
        "Analyze customer segments",
        "Create retention campaign"
      ]);
    }
  }, [selectedCustomer]);

  const addAIMessage = (content: string, actions?: AIMessage['actions']) => {
    const newMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content,
      timestamp: new Date(),
      actions
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (content: string) => {
    const newMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleAction = async (action: string) => {
    setIsThinking(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    switch (action) {
      case 'create_strategy':
        addAIMessage(
          "I've analyzed the at-risk customers and created personalized retention strategies:\n\n📧 Lisa Thompson: 15% discount + loyalty program invitation (65% success rate)\n📞 Mike Johnson: Personal call + premium upgrade offer (80% success rate)\n\nShall I execute these strategies?",
          [
            { label: "Execute all", action: "execute_strategies", variant: "success" },
            { label: "Review details", action: "review_strategies", variant: "primary" },
            { label: "Modify approach", action: "modify_strategies", variant: "secondary" }
          ]
        );
        break;
      
      case 'filter_at_risk':
        addAIMessage(
          "Found 2 customers at high churn risk:\n\n🚨 Lisa Thompson (30% risk) - 45 days since purchase\n⚠️ Mike Johnson (25% risk) - Declining engagement\n\nBoth need immediate attention. Would you like me to create retention plans?",
          [
            { label: "Create plans", action: "create_retention_plans", variant: "primary" },
            { label: "Show details", action: "show_at_risk_details", variant: "secondary" }
          ]
        );
        break;
      
      case 'analyze_vip':
        addAIMessage(
          "VIP Segment Analysis:\n\n⭐ 1 VIP customer: David Kim\n💰 $8,500 average value (5x regular customers)\n📈 5% churn risk (excellent retention)\n🎯 Growth opportunity: 2 customers close to VIP threshold\n\nRecommendation: Create VIP upgrade campaign for James Brown and Sarah Davis.",
          [
            { label: "Create VIP campaign", action: "create_vip_campaign", variant: "success" },
            { label: "Show VIP details", action: "vip_details", variant: "primary" }
          ]
        );
        break;
      
      default:
        addAIMessage("I'm processing your request. How else can I help you understand your customers?");
    }
    
    setIsThinking(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    addUserMessage(suggestion);
    handleAction('process_suggestion');
  };

  return (
    <div className="flex flex-col h-full">
      {/* AI Companion Header */}
      <div className="p-4 border-b" style={{ borderColor: colors.primary }}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <h3 className="font-medium" style={{ color: colors.dark }}>AI Companion</h3>
            <p className="text-sm" style={{ color: colors.neutral }}>
              {isThinking ? 'Thinking...' : 'Ready to help'}
            </p>
          </div>
        </div>
      </div>

      {/* Contextual Suggestions */}
      <div className="p-4 border-b" style={{ borderColor: colors.neutral }}>
        <h4 className="text-sm font-medium mb-2" style={{ color: colors.dark }}>
          🎯 Quick Questions
        </h4>
        <div className="space-y-2">
          {contextualSuggestions.slice(0, 3).map((suggestion, index) => (
            <button
              key={index}
              className="w-full text-left text-sm p-2 rounded hover:opacity-80 transition-opacity"
              style={{ backgroundColor: colors.primary + '20', color: colors.dark }}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              • {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs p-3 rounded-lg ${message.type === 'user' ? 'rounded-br-none' : 'rounded-bl-none'}`}
              style={{
                backgroundColor: message.type === 'user' ? colors.primary : colors.light,
                color: message.type === 'user' ? colors.light : colors.dark,
                border: message.type === 'ai' ? `1px solid ${colors.neutral}` : 'none'
              }}
            >
              <div className="text-sm whitespace-pre-line">{message.content}</div>
              
              {/* Action Buttons */}
              {message.actions && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {message.actions.map((action, index) => (
                    <button
                      key={index}
                      className="px-3 py-1 text-xs rounded hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: action.variant === 'success' ? colors.success :
                                       action.variant === 'warning' ? colors.warning :
                                       action.variant === 'primary' ? colors.primary : colors.neutral,
                        color: colors.light
                      }}
                      onClick={() => handleAction(action.action)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="text-xs mt-2 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex justify-start">
            <div className="p-3 rounded-lg rounded-bl-none" style={{ backgroundColor: colors.light, border: `1px solid ${colors.neutral}` }}>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: colors.primary, animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: colors.primary, animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: colors.primary, animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm" style={{ color: colors.neutral }}>AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t" style={{ borderColor: colors.primary }}>
        <h4 className="text-sm font-medium mb-2" style={{ color: colors.dark }}>
          ⚡ Quick Actions
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="p-2 text-xs rounded hover:opacity-80 transition-opacity"
            style={{ backgroundColor: colors.warning, color: colors.light }}
            onClick={() => handleAction('filter_at_risk')}
          >
            📧 Email at-risk
          </button>
          <button
            className="p-2 text-xs rounded hover:opacity-80 transition-opacity"
            style={{ backgroundColor: colors.success, color: colors.light }}
            onClick={() => handleAction('analyze_vip')}
          >
            📊 VIP analysis
          </button>
          <button
            className="p-2 text-xs rounded hover:opacity-80 transition-opacity"
            style={{ backgroundColor: colors.primary, color: colors.light }}
            onClick={() => handleAction('create_campaign')}
          >
            🎯 Create campaign
          </button>
          <button
            className="p-2 text-xs rounded hover:opacity-80 transition-opacity"
            style={{ backgroundColor: colors.neutral, color: colors.light }}
            onClick={() => handleAction('show_trends')}
          >
            📈 Show trends
          </button>
        </div>
      </div>
    </div>
  );
};
