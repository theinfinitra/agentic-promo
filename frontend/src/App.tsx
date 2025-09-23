import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { TableComponent } from './components/TableComponent';
import { FormComponent } from './components/FormComponent';
import { ChatMessage, StructuredData } from './types';
import './index.css';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentData, setCurrentData] = useState<StructuredData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { isConnected, isConnecting, lastMessage, sendMessage, error } = useWebSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      } else if (lastMessage.type === 'response') {
        setIsProcessing(false);  // Re-enable input/button
        
        // Add agent message to chat
        const agentMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'agent',
          content: lastMessage.structured_data?.type === 'html' 
            ? '✅ Generated interactive component' 
            : lastMessage.chat_response || 'Response received',
          timestamp: new Date(),
          structured_data: lastMessage.structured_data,
          raw_response: lastMessage.structured_data?.type === 'html' 
            ? lastMessage.chat_response 
            : undefined,
          expanded: false
        };
        
        setMessages(prev => [...prev, agentMessage]);
        
        // Update data panel if structured data is present
        if (lastMessage.structured_data) {
          setCurrentData(lastMessage.structured_data);
        }
      } else if (lastMessage.type === 'error') {
        setIsProcessing(false);  // Re-enable input/button on error
        
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'agent',
          content: `Error: ${lastMessage.message}`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  }, [lastMessage]);

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
      <div className="agent-working mx-auto mb-4"></div>
      <p className="font-medium text-trust">AI Agents Working...</p>
      <p className="text-sm mt-1 text-secondary">Processing your request</p>
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
                <div className="text-4xl mb-2">🎯</div>
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
            dangerouslySetInnerHTML={{ __html: currentData.content }}
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
      <header className="bg-white shadow-sm border-b border-gray-100 p-6" style={{backgroundColor: 'var(--background-light)', borderColor: 'var(--border-light)'}}>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl" style={{color: 'var(--trust-green)', fontFamily: 'Unbounded, sans-serif', fontWeight: 900}}>
            F<span style={{color: 'var(--accent-brown)', fontWeight: 900, fontFamily: 'Unbounded, sans-serif'}}>ai</span>rCl<span style={{color: 'var(--accent-brown)', fontWeight: 900, fontFamily: 'Unbounded, sans-serif'}}>ai</span>m
          </h1>
          <div className="flex items-center space-x-3">
            <div className={`rounded-full transition-all duration-300 ${
              isConnected ? 'status-connected' : isConnecting ? 'status-connecting' : 'status-disconnected'
            }`}></div>
            <span className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>
              {isConnected ? 'Agents Ready' : isConnecting ? 'Connecting...' : 'Agents Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content - Vertical Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel (Left - 40%) */}
        <div className="w-2/5 flex flex-col border-r border-gray-100 h-full">
          {/* Chat Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-3">
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
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
                
                {/* Raw response toggle for HTML messages */}
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
                        <pre className="whitespace-pre-wrap">{message.raw_response}</pre>
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
                  <p className="text-sm font-medium">Processing your request...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="chat-panel">
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
                placeholder="Ask me about customers, promotions..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-l-xl text-sm transition-all duration-200 border-r-0 focus:outline-none focus:ring-0 focus:border-gray-200"
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

            {error && !isConnected && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                Error: {error}
              </div>
            )}
          </div>
        </div>

        {/* Data Panel (Right - 60%) */}
        <div className="w-3/5 p-6 overflow-auto h-full relative" style={{backgroundColor: 'var(--background-light)'}}>
          {/* Content with conditional blur */}
          <div className={`${isProcessing ? 'blur-sm opacity-50' : ''} transition-all duration-300`}>
            {renderDataPanel()}
          </div>
          
          {/* Processing Overlay */}
          {isProcessing && (
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
