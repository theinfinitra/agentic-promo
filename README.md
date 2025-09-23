# Agentic Promotion Engine

An AI-powered promotion management system using Amazon Bedrock and Strands Agents SDK, demonstrating the agentic pattern where AI agents replace traditional business logic layers.

## 🏗️ Current Architecture

### **Deployed Implementation**
- **Single Agent**: Orchestrator with Amazon Nova LLM
- **3 Modular Tools**: Data retrieval, promotion creation, email sending
- **Data Sources**: DynamoDB (customers, promotions, orders)
- **Performance**: 6-10 second response times (optimized)
- **Deployment**: AWS Lambda + WebSocket API

### **File Structure**
```
src/
├── modular_agent.py              # Main orchestrator agent
├── config/data_sources.py        # Data source configuration
└── tools/
    ├── optimized_data_tool.py    # Data retrieval from DynamoDB
    ├── promotion_tool.py         # Promotion creation
    └── email_tool.py             # Email notifications via SES
```

### **Current Capabilities**
- ✅ "Show VIP customers" → Data retrieval with AI filtering
- ✅ "Create 25% VIP discount" → Promotion creation with business logic
- ✅ "Email John about promotion" → Email sending via AWS SES
- ✅ Real-time WebSocket communication
- ✅ Structured data for dynamic UI rendering

## 🎯 Design Principles Achieved

### **1. Agentic Pattern**
```
Traditional: User → Business Logic → Database → Response
Agentic: User → AI Agent → Tools → Database → AI-Enhanced Response
```

### **2. Data Source Abstraction**
- Configuration-driven data sources
- Database-agnostic tool interface
- Easy environment swapping (dev/staging/prod)

### **3. Single API Endpoint**
- All operations through `/agent` WebSocket endpoint
- No complex REST API surface
- Natural language interface

### **4. Modular Tool Architecture**
- Tools exist in separate files
- Reusable across different agents
- Easy to test and maintain

## 🚀 Roadmap: Evolution to True Dynamic Intelligence

### **Current State: Configuration-Driven (✅ COMPLETE)**
```python
# What we have now - still "hardcoded"
@tool
def get_data(source: str, filters: dict = None):
    config = DATA_SOURCES.get(source)  # Predefined mapping
    if config["type"] == "dynamodb":   # Hardcoded logic
        return _get_dynamodb_data()    # Fixed implementation
```

### **Phase 1: Schema-Aware Query Generation (🎯 NEXT)**

**Goal**: LLM generates native database queries from natural language

**Enhanced Configuration**:
```python
DATA_SOURCES = {
    "customers": {
        "type": "dynamodb",
        "table": "customers", 
        "schema": {
            "id": "string (primary key)",
            "name": "string",
            "email": "string",
            "segment": "string (VIP|Premium|Regular)",
            "total_spent": "number",
            "join_date": "date"
        },
        "relationships": {
            "orders": "customers.id = orders.customer_id"
        }
    }
}
```

**New Tool**:
```python
@tool
def intelligent_query(user_request: str) -> str:
    """LLM generates appropriate database queries based on schema knowledge"""
    # "Show customers who spent > $1000" → DynamoDB FilterExpression
    # "Recent orders" → PostgreSQL SELECT with date filter
```

**Capabilities**:
- ✅ Natural language to native queries
- ✅ Schema-aware field validation
- ✅ Type-safe query generation
- ✅ Multi-database query support

### **Phase 2: Business Relationship Intelligence (🔮 FUTURE)**

**Goal**: LLM understands business relationships and generates complex queries

**Enhanced Schema**:
```python
"business_rules": {
    "vip_threshold": "total_spent > 2000",
    "recent_orders": "order_date > NOW() - INTERVAL '30 days'",
    "seasonal_customers": "active in Q4 only"
}
```

**Capabilities**:
- ✅ Cross-table JOIN generation
- ✅ Business rule application
- ✅ Temporal pattern understanding
- ✅ Complex aggregation queries

**Examples**:
```
"VIP customers with recent orders" → 
  1. Query customers WHERE segment = 'VIP'
  2. Query orders WHERE customer_id IN (...) AND order_date > last_month
  3. Correlate results with business logic
```

### **Phase 3: Write Approval Workflow (🔮 FUTURE)**

**Goal**: Human approval required for all write operations

**New Tools**:
```python
@tool
def request_write_approval(query_description: str, generated_query: str) -> str:
    """Request human approval for write operations"""

@tool
def execute_approved_write(approval_token: str) -> str:
    """Execute pre-approved write operation"""
```

**Workflow**:
```
User: "Create promotion for VIP customers"
↓
LLM: Generates INSERT INTO promotions (...)
↓
System: Sends approval request (email/WebSocket/Slack)
↓
Human: Approves/Rejects with reasoning
↓
LLM: Executes on approval or explains rejection
```

**Safety Features**:
- ✅ Query preview before execution
- ✅ Impact estimation (records affected)
- ✅ Rollback capability
- ✅ Audit trail for all operations

### **Phase 4: Advanced Intelligence (🔮 FUTURE)**

**Cross-Database Operations**:
- Federated queries across DynamoDB + PostgreSQL
- Intelligent data correlation
- Performance optimization

**Advanced Business Logic**:
- Seasonal pattern recognition
- Customer lifecycle understanding
- Predictive promotion effectiveness

**Enhanced Safety**:
- Query cost estimation
- Performance impact analysis
- Automatic query optimization

## 🔧 Technical Decisions Made

### **Tools vs Agents**
- **Tools**: Simple functions (database queries, API calls, calculations)
- **Agents**: Complex reasoning (strategy, analysis, decision-making)
- **Current**: 1 Agent + 3 Tools (optimal for data-focused use case)

### **Performance Optimizations**
- ✅ Connection pooling (`@lru_cache`)
- ✅ Concise system prompts (reduced LLM processing time)
- ✅ Fast structured data extraction
- ✅ Cached agent instances

### **Architecture Benefits**
- ✅ No traditional business logic layer
- ✅ Database-agnostic design
- ✅ Single API endpoint
- ✅ Dynamic UI generation
- ✅ Natural language interface

## 🎯 Key Insights

### **What Works**
- **Agentic Pattern**: AI agents successfully replace business logic
- **Modular Tools**: Clean separation of concerns
- **Performance**: Sub-10 second responses achievable
- **Real Data**: No hallucination, honest error reporting

### **What's Next**
- **Dynamic Query Generation**: Move from configuration to intelligence
- **Business Relationship Understanding**: Cross-table reasoning
- **Write Safety**: Human approval workflows
- **Advanced Analytics**: Predictive and prescriptive capabilities

## 🚀 Getting Started

### **Current Deployment**
```bash
# Deploy the modular agent
aws lambda update-function-code \
  --function-name agentic-promo-dev-orchestrator \
  --zip-file fileb://clean-modular-agent.zip \
  --profile infinitra-dev
```

### **Test Capabilities**
- "Show VIP customers" - Data retrieval with AI filtering
- "Create 25% VIP discount" - Promotion creation
- "Email john@example.com about new promotion" - Email notifications

### **Next Implementation**
Focus on Phase 1: Schema-aware query generation for true dynamic intelligence.

---

*This roadmap represents the evolution from configuration-driven to truly intelligent agentic data access, maintaining safety and performance while adding sophisticated AI reasoning capabilities.*
