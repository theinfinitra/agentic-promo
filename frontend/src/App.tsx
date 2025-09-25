import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { TableComponent } from './components/TableComponent';
import { FormComponent } from './components/FormComponent';
import { ChatMessage, StructuredData } from './types';
import { marked } from 'marked';
import './index.css';

const formatRawResponse = (rawResponse: string): string => {
  if (!rawResponse) return '';
  
  // Remove thinking blocks and HTML code blocks only
  let formatted = rawResponse.replace(/<thinking[\s\S]*?<\/thinking>/gi, '');
  formatted = formatted.replace(/```html[\s\S]*?```/g, '');
  
  return formatted.trim();
};

const formatChatMessage = (content: string): string => {
  // Only remove thinking blocks and HTML code blocks if they exist
  let formatted = content;
  
  if (formatted.includes('<thinking')) {
    formatted = formatted.replace(/<thinking[\s\S]*?<\/thinking>/gi, '');
  }
  
  if (formatted.includes('```html')) {
    formatted = formatted.replace(/```html[\s\S]*?```/g, '');
  }
  
  if (formatted.includes('<markdown>')) {
    formatted = formatted.replace(/<markdown>/gi, '').replace(/<\/markdown>/gi, '');
  }
  
  return formatted.trim();
};

const formatDataContent = (content: string): string => {
  // Remove thinking blocks
  let formatted = content.replace(/<thinking>([\s\S]*?)<\/thinking>/gi, '');
  formatted = formatted.replace(/<div class="thinking-block">[\s\S]*?<\/div>/gi, '');
  formatted = formatted.replace(/<thinking[^>]*>/gi, '');
  formatted = formatted.replace(/^<thinking\s*$/gm, '');
  
  // Clean whitespace
  formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');
  formatted = formatted.trim();
  
  // Parse markdown if no HTML
  if (!formatted.includes('<div') && !formatted.includes('<table')) {
    try {
      formatted = marked.parse(formatted) as string;
    } catch (error) {
      console.warn('Markdown parsing failed:', error);
    }
  }
  
  return formatted;
};

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentData, setCurrentData] = useState<StructuredData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingStep, setThinkingStep] = useState('');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const { isConnected, isConnecting, lastMessage, sendMessage, error } = useWebSocket();

  const scrollToBottom = () => {
    if (!userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setUserScrolledUp(!isNearBottom);
    }
  };

  const extractReasoningFromContent = (content: string) => {
    // Since we now filter thinking blocks in formatMessageContent,
    // just return the content as-is (no reasoning to extract)
    return { reasoning: '', cleanContent: content };
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
  }, [messages, isProcessing]);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'acknowledgment') {
        setIsProcessing(true);
        setThinkingStep('');
      } else if (lastMessage.type === 'tool_progress') {
        // Map tool_progress to thinking steps
        const tool = lastMessage.tool || 'system';
        const status = lastMessage.status || 'working';
        setThinkingStep(`${tool}: ${status}...`);
      } else if (lastMessage.type === 'text_chunk') {
        // Handle streaming text chunks - filter thinking content
        const chunkContent = lastMessage.content || '';
        
        if (!streamingMessageId) {
          // Start new streaming message
          const messageId = Date.now().toString();
          setStreamingMessageId(messageId);
          setIsProcessing(false);
          setThinkingStep('');
          
          const streamingMessage: ChatMessage = {
            id: messageId,
            type: 'agent',
            content: chunkContent,
            timestamp: new Date(),
            is_streaming: true,
            is_complete: false
          };
          
          setMessages(prev => [...prev, streamingMessage]);
        } else {
          // Append to existing streaming message
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, content: msg.content + chunkContent }
              : msg
          ));
        }
      } else if (lastMessage.type === 'message_complete') {
        // Mark streaming as complete but keep message
        if (streamingMessageId) {
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, is_streaming: false }
              : msg
          ));
        }
      } else if (lastMessage.type === 'response') {
        // Final response with structured data
        setIsProcessing(false);
        setThinkingStep('');
        
        if (streamingMessageId) {
          // Update existing streaming message with final data
          setMessages(prev => prev.map(msg => {
            if (msg.id === streamingMessageId) {
              // Apply formatting only to final complete message
              const cleanContent = formatChatMessage(msg.content);
              const { reasoning, cleanContent: finalContent } = extractReasoningFromContent(cleanContent);
              
              return {
                ...msg, 
                is_streaming: false, 
                is_complete: true,
                content: finalContent || cleanContent,
                structured_data: lastMessage.structured_data,
                raw_response: reasoning ? `${reasoning}\n\n${lastMessage.chat_response || ''}` : (
                  lastMessage.structured_data?.type === 'html' 
                    ? lastMessage.chat_response 
                    : undefined
                )
              };
            }
            return msg;
          }));
          setStreamingMessageId(null);
        }
        
        // Update data panel
        if (lastMessage.structured_data) {
          setCurrentData(lastMessage.structured_data);
        }
      } else if (lastMessage.type === 'error') {
        setIsProcessing(false);
        setThinkingStep('');
        setStreamingMessageId(null);
        
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'agent',
          content: `Error: ${lastMessage.message}`,
          timestamp: new Date(),
          is_complete: true
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  }, [lastMessage, streamingMessageId]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !isConnected) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Send to agent
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
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: `Creating: ${formData.name || 'New item'}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Send to agent
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
    // If already minimized, just set the input value without sending
  };

  const ProcessingAnimation = () => (
    <div className="text-center">
      <svg className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <p className="font-medium text-trust">AI Agents Working...</p>
      {thinkingStep && (
        <p className="text-sm mt-1 text-secondary">🤔 {thinkingStep}</p>
      )}
      {!thinkingStep && (
        <p className="text-sm mt-1 text-secondary">Processing your request</p>
      )}
    </div>
  );

  const getDataPanelTitle = () => {
    if (isProcessing) return "Processing Request";
    if (!currentData) return "Data Panel";
    
    switch (currentData.type) {
      case 'table':
        return currentData.title || "Data Table";
      case 'form':
        return currentData.title || "Form";
      case 'html':
        const content = currentData.content?.toLowerCase() || '';
        
        // Check for specific content types with better priority
        if (content.includes('customer') && content.includes('table')) return "Customer Data";
        if (content.includes('promotion') && content.includes('table')) return "Active Promotions";
        if (content.includes('order') && content.includes('table')) return "Order History";
        
        // Form checks
        if (content.includes('form') && content.includes('promotion')) return "Create Promotion";
        if (content.includes('edit') && content.includes('promotion')) return "Edit Promotion";
        
        // Generic fallbacks
        if (content.includes('customer')) return "Customer Data";
        if (content.includes('promotion')) return "Promotions";
        if (content.includes('order')) return "Orders";
        if (content.includes('form')) return "Form";
        if (content.includes('table')) return "Data Table";
        
        return "Interactive Component";
      default:
        return "Data View";
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
          {/* Content Title */}
          <div className="mb-6">
            <h2 className="text-xl font-bold" style={{color: 'var(--trust-green)'}}>{getDataPanelTitle()}</h2>
          </div>
          
          {/* HTML Content */}
          <div 
            dangerouslySetInnerHTML={{ __html: formatDataContent(currentData.content) }}
            onClick={handleHtmlClick}
          />
        </div>
      );
    }

    switch (currentData.type) {
      case 'table':
        return (
          <div className="data-panel">
            <div className="mb-6">
              <h2 className="text-xl font-bold" style={{color: 'var(--trust-green)'}}>{getDataPanelTitle()}</h2>
            </div>
            <TableComponent data={currentData} onAction={handleTableAction} />
          </div>
        );
      case 'form':
        return (
          <div className="data-panel">
            <div className="mb-6">
              <h2 className="text-xl font-bold" style={{color: 'var(--trust-green)'}}>{getDataPanelTitle()}</h2>
            </div>
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
    // Handle form submissions from HTML content
    const target = e.target as HTMLElement;
    
    if (target.tagName === 'BUTTON' && target.getAttribute('type') === 'submit') {
      e.preventDefault();
      
      // Find the parent form
      const form = target.closest('form');
      if (form) {
        const formData = new FormData(form);
        const data: Record<string, any> = {};
        
        formData.forEach((value, key) => {
          data[key] = value;
        });
        
        // Send form data to agent
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
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl text-gray-100" style={{fontFamily: 'Unbounded, sans-serif', fontWeight: 900}}>
            F<span style={{color: 'var(--neutral-gray)', fontWeight: 900, fontFamily: 'Unbounded, sans-serif'}}>ai</span>rCl<span style={{color: 'var(--neutral-gray)', fontWeight: 900, fontFamily: 'Unbounded, sans-serif'}}>ai</span>m
          </h1>
        </div>
      </header>

      {/* Main Content - Vertical Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel (Left - 40%) */}
        <div className="w-2/5 flex flex-col border-r border-gray-200 h-full bg-white">
          {/* Chat Messages */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 p-6 overflow-y-auto space-y-3"
            onScroll={handleScroll}
          >
            {/* QuickStart Pills - Initial Position */}
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
                        __html: marked.parse(formatRawResponse(message.raw_response || message.content)) as string 
                      }} />
                    )}
                    {message.is_streaming && (
                      <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1">|</span>
                    )}
                  </div>
                </div>
                
                {/* Raw response toggle for HTML messages */}
                {message.type === 'agent' && message.raw_response && message.is_complete && (
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
                        <pre className="whitespace-pre-wrap">{message.raw_response}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {(isProcessing || thinkingStep) && (
              <div className="flex justify-start">
                <div className="message-agent flex items-center space-x-2">
                  <div className="loading-spinner"></div>
                  <div>
                    <p className="text-sm font-medium">
                      {thinkingStep ? 'Thinking...' : 'Processing your request...'}
                    </p>
                    {thinkingStep && (
                      <p className="text-xs text-gray-600 mt-1">🤔 {thinkingStep}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="chat-panel">
            {/* Connection Status */}
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

            {/* Minimized QuickStart Pills */}
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
                disabled={!isConnected || isProcessing || streamingMessageId !== null}
              />
              <button
                onClick={handleSendMessage}
                disabled={!isConnected || isProcessing || !inputValue.trim() || streamingMessageId !== null}
                className="send-btn-connected disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </div>

            {/* AI Disclaimer */}
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

        {/* Data Panel (Right - 60%) */}
        <div className="w-3/5 p-6 overflow-auto h-full relative bg-gray-200">
          {/* Content with conditional blur */}
          <div className={`${(isProcessing || thinkingStep || streamingMessageId !== null) ? 'blur-sm opacity-50' : ''} transition-all duration-300`}>
            {renderDataPanel()}
          </div>
          
          {/* Processing Overlay */}
          {(isProcessing || thinkingStep || streamingMessageId !== null) && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-20 backdrop-blur-sm">
              <ProcessingAnimation />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
