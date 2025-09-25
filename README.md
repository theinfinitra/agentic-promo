# Agentic Promotion Engine

An AI-powered promotion management system using Amazon Bedrock and Strands Agents SDK, demonstrating the agentic pattern where AI agents replace traditional business logic layers.

## 🏗️ Current Architecture

### **Deployed Implementation**
- **Single Agent**: Orchestrator with Amazon Nova LLM
- **5 Modular Tools**: Data retrieval, segmentation analysis, promotion creation, email sending, UI generation
- **Data Sources**: DynamoDB (operational) + Aurora (analytical) hybrid architecture
- **Performance**: 6-10 second response times (optimized)
- **Deployment**: AWS Lambda + WebSocket API
- **Frontend**: React TypeScript with real-time streaming

### **File Structure**
```
src/
├── orchestrator.py               # Main streaming orchestrator
├── modular_agent.py             # Legacy agent (backup)
├── config/data_sources.py       # Hybrid data source configuration
├── tools/
│   ├── optimized_data_tool.py   # Hybrid DynamoDB + Aurora data retrieval
│   ├── segmentation_tool.py     # RFM analysis & customer segmentation
│   ├── promotion_tool.py        # Promotion creation with business logic
│   ├── email_tool.py           # Email notifications via SES
│   └── ui_agent_tool.py        # Dynamic UI component generation
└── streaming.py                # WebSocket streaming implementation

frontend/
├── src/
│   ├── App.tsx                 # Main application with split-panel layout
│   ├── components/             # Dynamic UI components (Table, Form)
│   ├── hooks/useWebSocket.ts   # WebSocket connection management
│   └── types/index.ts          # TypeScript definitions
└── build/                      # Production build
```

### **Current Capabilities**
- ✅ **Real-time streaming**: WebSocket communication with chunk-based responses
- ✅ **Hybrid data architecture**: DynamoDB (operational) + Aurora (analytical)
- ✅ **Advanced segmentation**: RFM analysis, behavioral clustering, segment insights
- ✅ **Dynamic UI generation**: AI-generated tables, forms, and interactive components
- ✅ **Professional frontend**: Split-panel layout with chat + data visualization
- ✅ **Content filtering**: Clean chat messages with raw response toggle
- ✅ **Connection management**: Auto-reconnect with offline state handling

### **Frontend Features (✅ COMPLETE - Sept 25, 2024)**
- **Split-panel design**: Chat (40%) + Data Panel (60%) with visual distinction
- **Real-time streaming**: Chunk-based message streaming with typing indicators
- **Smart content filtering**: Removes HTML/thinking blocks from chat, shows analysis
- **Professional UI**: Dark header, white chat panel, gray data panel with depth
- **Connection status**: Live indicator with retry functionality near chat input
- **AI disclaimer**: "FairClaim uses AI. Please verify important information"
- **Professional icons**: Chart bar for empty state, spinning cog for processing
- **Markdown rendering**: Formatted analysis with bold headers and bullet points
- **Raw response toggle**: Debug view for complete backend responses
- **Quick-start options**: Contextual suggestions for common operations

## 🎯 Design Principles Achieved

### **1. Agentic Pattern**
```
Traditional: User → Business Logic → Database → Response
Agentic: User → AI Agent → Tools → Database → AI-Enhanced Response
```

### **2. Hybrid Data Architecture**
- **DynamoDB**: Real-time operational data (customers, promotions, orders)
- **Aurora**: Analytical queries (segmentation, RFM analysis, insights)
- **Configuration-driven**: Easy environment swapping (dev/staging/prod)

### **3. Real-time Streaming Interface**
- Single WebSocket endpoint for all operations
- Chunk-based streaming with progress indicators
- Natural language interface with structured data output

### **4. Modular Tool Architecture**
- Tools exist in separate files with clear responsibilities
- Reusable across different agents and contexts
- Easy to test, maintain, and extend

## 🚀 Progress Update (September 25, 2024)

### **✅ COMPLETED**

#### **Backend Enhancements**
- **Streaming orchestrator**: Real-time WebSocket responses with progress tracking
- **Hybrid data sources**: DynamoDB + Aurora integration for operational + analytical queries
- **Advanced segmentation**: RFM scoring, behavioral analysis, segment insights
- **Tool expansion**: 5 specialized tools for comprehensive promotion management

#### **Frontend Complete Redesign**
- **Professional UI/UX**: Split-panel layout with visual hierarchy
- **Real-time streaming**: Chunk-based message handling with typing indicators
- **Smart content filtering**: Clean chat messages while preserving analysis
- **Connection management**: Live status with retry functionality
- **Accessibility**: Professional icons, proper contrast, user-friendly messaging
- **Debug capabilities**: Raw response toggle for development/troubleshooting

#### **User Experience Improvements**
- **Visual distinction**: Clear separation between chat and data panels
- **Processing feedback**: Overlay with spinning cog during AI operations
- **Content quality**: Markdown-formatted analysis with clean presentation
- **Error handling**: Graceful offline states with reconnection options

### **🎯 NEXT STEPS (Priority Order)**

#### **Phase 1: Enhanced Data Intelligence (2-3 weeks)**
```python
# Goal: Dynamic query generation from natural language
@tool
def intelligent_query(user_request: str, data_sources: dict) -> str:
    """Generate native database queries from natural language using schema awareness"""
    # "Show customers who spent > $1000 last month" → DynamoDB + Aurora federated query
    # "VIP customers with declining engagement" → Complex analytical query
```

**Capabilities to Add**:
- Schema-aware query generation
- Cross-database federated queries  
- Natural language to SQL/NoSQL translation
- Query optimization and cost estimation

#### **Phase 2: Advanced Segmentation Features (2-3 weeks)**
- **Predictive segments**: Churn prediction, lifetime value forecasting
- **Dynamic thresholds**: AI-recommended segment boundaries
- **Segment migration tracking**: Customer journey analysis
- **Performance analytics**: Segment health monitoring

#### **Phase 3: Campaign Intelligence (3-4 weeks)**
- **A/B testing framework**: Automated campaign optimization
- **Performance prediction**: ROI forecasting for promotions
- **Real-time adjustment**: Dynamic campaign modification
- **Multi-channel orchestration**: Email, SMS, push notifications

#### **Phase 4: Write Safety & Approval Workflow (2-3 weeks)**
- **Human approval gates**: All write operations require confirmation
- **Impact estimation**: Preview changes before execution
- **Rollback capabilities**: Safe operation reversal
- **Audit trails**: Complete operation logging

### **🔧 Technical Debt & Optimizations**

#### **Performance Improvements**
- **Message virtualization**: Handle large chat histories efficiently
- **Component lazy loading**: Optimize initial page load
- **WebSocket reconnection**: More robust connection handling
- **Caching strategy**: Reduce redundant API calls

#### **Code Quality**
- **Unit testing**: Frontend components and backend tools
- **E2E testing**: Complete user workflow validation
- **Error boundaries**: Better React error handling
- **TypeScript coverage**: Improve type safety

#### **Accessibility & UX**
- **Screen reader support**: ARIA labels and navigation
- **Keyboard shortcuts**: Power user efficiency
- **Mobile responsiveness**: Touch-friendly interface
- **Loading states**: Better user feedback

## 🎯 Key Insights & Lessons Learned

### **What Works Exceptionally Well**
- **Agentic pattern**: AI agents successfully replace complex business logic
- **Real-time streaming**: Users prefer immediate feedback over batch responses
- **Hybrid data architecture**: Operational + analytical separation improves performance
- **Modular tools**: Clean separation enables rapid feature development
- **Professional UI**: Split-panel design effectively separates conversation from data

### **Technical Breakthroughs**
- **Content filtering**: Successfully separated AI reasoning from user-facing content
- **Streaming optimization**: Sub-10 second responses with progress indicators
- **Dynamic UI generation**: AI creates appropriate visualizations for data types
- **Connection resilience**: Graceful handling of network interruptions

### **User Experience Discoveries**
- **Visual hierarchy**: Clear panel distinction significantly improves usability
- **Processing feedback**: Users need constant feedback during AI operations
- **Content quality**: Clean, formatted analysis is crucial for business users
- **Debug access**: Raw response toggle essential for troubleshooting

## 🚀 Getting Started

### **Current Deployment**
```bash
# Backend deployment
aws lambda update-function-code \
  --function-name agentic-promo-dev-orchestrator \
  --zip-file fileb://agentic-promo-lambda.zip \
  --profile infinitra-dev

# Frontend deployment
cd frontend && npm run build
aws s3 sync build/ s3://your-frontend-bucket --delete
```

### **Test Current Capabilities**
- **"Show VIP customers"** → Advanced segmentation with RFM analysis
- **"Create 25% VIP discount"** → Promotion creation with business logic
- **"Analyze customer segments"** → Behavioral clustering and insights
- **"Email john@example.com about promotion"** → Personalized notifications

### **Development Environment**
```bash
# Frontend development
cd frontend && npm start

# Backend testing
python -m pytest src/tests/

# WebSocket testing
# Use scripts/test-websocket.html for manual testing
```

---

**Last Updated**: September 25, 2024  
**Status**: Production-ready frontend with advanced backend capabilities  
**Next Milestone**: Dynamic query generation and predictive analytics
