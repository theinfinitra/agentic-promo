import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { TableComponent } from './components/TableComponent';
import { FormComponent } from './components/FormComponent';
import { ChatMessage, StructuredData, ProgressPhase } from './types';
import { marked } from 'marked';
import './index.css';

const extractPureHTML = (content: string): string => {
  if (!content) return content;
  
  // First try to extract from HTML code blocks
  const htmlMatch = content.match(/```html\s*([\s\S]*?)\s*```/i);
  if (htmlMatch) {
    return htmlMatch[1].trim();
  }
  
  // If no code blocks, return the content as-is (it's already HTML)
  return content.trim();
};



const cleanChatResponse = (content: string): string => {
  if (!content) return '';
  
  // Remove thinking blocks
  let cleaned = content.replace(/<thinking[\s\S]*?<\/thinking>/gi, '');
  
  // Remove HTML code blocks
  cleaned = cleaned.replace(/```html[\s\S]*?```/gi, '');
  
  // Clean up extra whitespace but preserve markdown structure
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
  
  return cleaned;
};



function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentData, setCurrentData] = useState<StructuredData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [stepThinking, setStepThinking] = useState({
    analysis: [] as string[],
    data: [] as string[],
    ui: [] as string[]
  });
  const [currentStep, setCurrentStep] = useState<'analysis' | 'data' | 'ui'>('analysis');
  const [activeSteps, setActiveSteps] = useState<('analysis' | 'data' | 'ui')[]>(['analysis']);
  const [processingStartTime, setProcessingStartTime] = useState<Date | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const { isConnected, isConnecting, lastMessage, sendMessage, error } = useWebSocket();

  const scrollToBottom = useCallback(() => {
    if (!userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [userScrolledUp]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setUserScrolledUp(!isNearBottom);
    }
  };

  const getCurrentStepStatus = () => {
    // Use the actual tool from lastMessage instead of currentStep state
    const tool = lastMessage?.tool || '';
    if (tool.includes('generate_ui_component')) return "🎨 Generating visualization...";
    if (tool.includes('process_data_request')) return "🔧 Retrieving data...";
    if (currentStep === 'data') return "🔧 Retrieving data...";
    if (currentStep === 'ui') return "🎨 Generating visualization...";
    return "🧠 Analyzing request...";
  };



  const getElapsedTime = () => {
    if (!processingStartTime) return '00:00';
    const elapsed = Math.floor((Date.now() - processingStartTime.getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleRawResponse = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, expanded: !msg.expanded }
        : msg
    ));
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing, scrollToBottom]);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'acknowledgment') {
        setIsProcessing(true);
        setProcessingStartTime(new Date());
        setCurrentStep('analysis');
        setActiveSteps(['analysis']);
        setStepThinking({ analysis: [], data: [], ui: [] });
      } else if (lastMessage.type === 'tool_progress') {
        const tool = lastMessage.tool || '';
        if (tool.includes('process_data_request')) {
          setCurrentStep('data');
          setActiveSteps(prev => prev.includes('data') ? prev : [...prev, 'data']);
        } else if (tool.includes('generate_ui_component')) {
          setCurrentStep('ui');
          setActiveSteps(prev => prev.includes('ui') ? prev : [...prev, 'ui']);
        }
      } else if (lastMessage.type === 'text_chunk') {
        const content = lastMessage.content || '';
        
        if (content.trim() && !content.includes('<thinking>') && !content.includes('</thinking>')) {
          setStepThinking(prev => ({
            ...prev,
            [currentStep]: [...prev[currentStep], content]
          }));
        }
        
        // Don't create streaming messages for thinking content
      } else if (lastMessage.type === 'response') {
        setIsProcessing(false);
        setProcessingStartTime(null);
        
        // Add final message to chat
        const finalMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'agent',
          content: cleanChatResponse(lastMessage.chat_response || ''),
          raw_response: lastMessage.chat_response || '',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, finalMessage]);
        
        if (lastMessage.structured_data?.content) {
          setCurrentData({
            type: 'html',
            content: lastMessage.structured_data.content
          });
        }
      }
    }
  }, [lastMessage, currentStep]);

  const renderProgressOverlay = () => {
    const stepConfig = {
      analysis: { icon: '🧠', title: 'Request Analysis' },
      data: { icon: '🔧', title: 'Data Analysis' },
      ui: { icon: '🎨', title: 'Generating Visualization' }
    };

    return (
      <div className="terminal-overlay">
        <div className="terminal-header">
          <div className="terminal-title">AI Processing Terminal</div>
          <div className="terminal-time">{getElapsedTime()}</div>
        </div>
        
        <div className="terminal-content">
          {activeSteps.map(step => (
            <div key={step} className="terminal-step">
              <div className="terminal-step-header">
                <span className="terminal-icon">{stepConfig[step].icon}</span>
                <span className="terminal-step-title">{stepConfig[step].title}</span>
                {step === currentStep && <span className="terminal-cursor">_</span>}
              </div>
              <div className="terminal-thinking">
                {stepThinking[step].join('')}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !isConnected) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    sendMessage({
      input: inputValue,
      intent: 'general'
    });
    
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTableAction = (action: string, item: any) => {
    const actionMessage = `${action} ${item.name || item.id}`;
    setInputValue(actionMessage);
  };

  const handleFormSubmit = (formData: Record<string, any>) => {
    const submitMessage = `Submit form: ${JSON.stringify(formData)}`;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: `Creating: ${formData.name || 'New item'}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    sendMessage({
      input: submitMessage,
      intent: 'create'
    });
  };

  const [showQuickStarts, setShowQuickStarts] = useState(true);
  const [quickStartsMinimized, setQuickStartsMinimized] = useState(false);

  const quickStartOptions = [
    "List All VIP customers",
    "Show active promotions", 
    "Customers who deserve a promotion",
    "Create new promotion",
    "Show customer segments",
    "Recent order analysis"
  ];

  const handleQuickStart = (option: string) => {
    setInputValue(option);
    if (!quickStartsMinimized) {
      setQuickStartsMinimized(true);
      handleSendMessage();
    }
  };

  const renderDataPanel = () => {
    if (!currentData) {
      return (
        <div className="data-panel flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            {isProcessing ? <></> :
              <>
                <svg className="w-12 h-12 mb-2 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="font-medium">Ask me something to see data here!</p>
                <p className="text-sm mt-1">Try: "Show VIP customers" or "Create promotion"</p>
              </>
            }
          </div>
        </div>
      );
    }

    if (currentData.type === 'html' && currentData.content) {
      return (
        <div className="data-panel">
          <div 
            dangerouslySetInnerHTML={{ __html: extractPureHTML(currentData.content) }}
            onClick={handleHtmlClick}
          />
        </div>
      );
    }

    switch (currentData.type) {
      case 'table':
        return (
          <div className="data-panel">
            <TableComponent data={currentData} onAction={handleTableAction} />
          </div>
        );
      case 'form':
        return (
          <div className="data-panel">
            <FormComponent data={currentData} onSubmit={handleFormSubmit} />
          </div>
        );
      default:
        return (
          <div className="data-panel">
            <pre className="text-sm text-secondary">
              {JSON.stringify(currentData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const handleHtmlClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    if (target.tagName === 'BUTTON' && target.getAttribute('type') === 'submit') {
      e.preventDefault();
      
      const form = target.closest('form');
      if (form) {
        const formData = new FormData(form);
        const data: Record<string, any> = {};
        
        formData.forEach((value, key) => {
          data[key] = value;
        });
        
        const submitMessage = `Create promotion with data: ${JSON.stringify(data)}`;
        
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'user',
          content: `Creating promotion: ${data.name || 'New promotion'}`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        sendMessage({
          input: submitMessage,
          intent: 'create'
        });
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-gray-800 shadow-sm border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl text-gray-100" style={{fontFamily: 'Unbounded, sans-serif', fontWeight: 900}}>
            F<span style={{color: 'var(--neutral-gray)', fontWeight: 900, fontFamily: 'Unbounded, sans-serif'}}>ai</span>rCl<span style={{color: 'var(--neutral-gray)', fontWeight: 900, fontFamily: 'Unbounded, sans-serif'}}>ai</span>m
          </h1>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex flex-col border-r border-gray-200 h-full bg-white" style={{width: '30%'}}>
          <div 
            ref={messagesContainerRef}
            className="flex-1 p-6 overflow-y-auto space-y-3"
            onScroll={handleScroll}
          >
            {showQuickStarts && !quickStartsMinimized && messages.length === 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium mb-3" style={{color: 'var(--text-secondary)'}}>
                  Quick Start Options:
                </p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {quickStartOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickStart(option)}
                      className="px-3 py-2 text-sm rounded-full border transition-all duration-200 hover:scale-105 flex-shrink-0"
                      style={{
                        borderColor: 'var(--border-light)',
                        backgroundColor: 'var(--background-light)',
                        color: 'var(--trust-green)'
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.slice(-10).map((message) => (
              <div key={message.id}>
                <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={message.type === 'user' ? 'message-user' : 'message-agent'}>
                    {message.is_streaming ? (
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>
                    ) : (
                      <div className="text-sm" dangerouslySetInnerHTML={{ 
                        __html: marked.parse(message.content) as string 
                      }} />
                    )}
                    {message.is_streaming && (
                      <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1">|</span>
                    )}
                  </div>
                </div>
                
                {message.type === 'agent' && message.raw_response && (
                  <div className="ml-4 mt-2">
                    <button
                      onClick={() => toggleRawResponse(message.id)}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                    >
                      <span>{message.expanded ? '▲' : '▼'}</span>
                      <span>{message.expanded ? 'Hide' : 'Show'} raw response</span>
                    </button>
                    
                    {message.expanded && (
                      <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-700 max-h-32 overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ 
                          __html: marked.parse(message.raw_response) as string 
                        }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="message-agent flex items-center space-x-2">
                  <div className="loading-spinner"></div>
                  <div className="text-sm">
                    {getCurrentStepStatus()}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-panel">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`rounded-full transition-all duration-300 ${
                  isConnected ? 'status-connected' : isConnecting ? 'status-connecting' : 'status-disconnected'
                }`}></div>
                <span className="text-xs font-medium" style={{color: 'var(--text-secondary)'}}>
                  {isConnected ? 'Online' : isConnecting ? 'Connecting...' : 'Offline'}
                </span>
                {!isConnected && !isConnecting && (
                  <button 
                    onClick={() => window.location.reload()} 
                    className="text-xs text-blue-600 hover:underline ml-2"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>

            {showQuickStarts && quickStartsMinimized && (
              <div className="mb-3 flex items-center justify-between">
                <div className="flex gap-1 overflow-x-auto flex-1 mr-2" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  {quickStartOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickStart(option)}
                      className="px-2 py-1 text-xs rounded-full border transition-all duration-200 hover:scale-105 flex-shrink-0"
                      style={{
                        borderColor: 'var(--border-light)',
                        backgroundColor: 'white',
                        color: 'var(--trust-green)'
                      }}
                    >
                      {option.length > 15 ? option.substring(0, 15) + '...' : option}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowQuickStarts(false)}
                  className="text-xs px-2 py-1 rounded hover:bg-gray-100 flex-shrink-0"
                  style={{color: 'var(--text-secondary)'}}
                >
                  ✕ Hide
                </button>
              </div>
            )}

            <div className="flex">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isConnected ? "Ask me about customers, promotions..." : "Agents offline - click Retry to reconnect"}
                className={`flex-1 px-4 py-3 border border-gray-200 rounded-l-xl text-sm transition-all duration-200 border-r-0 focus:outline-none focus:ring-0 focus:border-gray-200 ${
                  !isConnected ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
                }`}
                style={{borderColor: 'var(--border-light)'}}
                disabled={!isConnected || isProcessing}
              />
              <button
                onClick={handleSendMessage}
                disabled={!isConnected || isProcessing || !inputValue.trim()}
                className="send-btn-connected disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2 text-center">
              FairClaim uses AI. Please verify important information.
            </p>

            {error && !isConnected && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                Error: {error}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 overflow-auto h-full relative bg-gray-200" style={{width: '70%'}}>
          <div className={`${isProcessing ? 'blur-sm opacity-50' : ''} transition-all duration-300`}>
            {renderDataPanel()}
          </div>
          
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-20 backdrop-blur-sm">
              {renderProgressOverlay()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
