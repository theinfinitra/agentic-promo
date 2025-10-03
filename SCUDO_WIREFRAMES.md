# Scudo Wireframe Designs
**Integrated Customer Intelligence Workspace**

*Created: October 2, 2024*

---

## 🎨 **Main Workspace Layout**

### **Desktop Layout (1920x1080)**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 🛡️ Scudo Customer Intelligence    [Search: 🔍]    [Profile: 👤] [Settings: ⚙️] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ┌─────────────────────────────────────────────┐ ┌─────────────────────────────┐ │
│ │              DASHBOARD (70%)                │ │      CHAT INTERFACE (30%)   │ │
│ │                                             │ │                             │ │
│ │ ┌─────────┬─────────┬─────────┬─────────┐   │ │ 💬 Ask about your customers │ │
│ │ │ Total   │ Active  │At Risk  │Revenue  │   │ │                             │ │
│ │ │   10    │   7     │   2     │ $28.4K  │   │ │ 🎯 Quick Questions:         │ │
│ │ │  +2 ↗️   │  +1 ↗️   │  +1 ⚠️   │ +12% ↗️  │   │ │ • Why is Lisa at risk?      │ │
│ │ └─────────┴─────────┴─────────┴─────────┘   │ │ • How to grow VIP segment?  │ │
│ │                                             │ │ • Show business customers   │ │
│ │ ┌─────────────────────┬─────────────────────┐ │ │                             │ │
│ │ │ Customer Health     │ 🚨 Immediate Action │ │ │ ┌─────────────────────────┐ │ │
│ │ │ ████████ VIP (1)    │ Lisa Thompson       │ │ │ │ User: Show VIP customers│ │ │
│ │ │ $8,500 avg          │ 30% churn risk ⚠️    │ │ │ └─────────────────────────┘ │ │
│ │ │                     │ Contact in 3 days   │ │ │ ┌─────────────────────────┐ │ │
│ │ │ ██████████████      │                     │ │ │ │ AI: Found 1 VIP customer│ │ │
│ │ │ Active (3)          │ Mike Johnson        │ │ │ │ David Kim - $8,500 spent│ │ │
│ │ │ $3,133 avg          │ 25% churn risk ⚠️    │ │ │ │ [View Profile] [Analyze]│ │ │
│ │ │                     │ Send retention offer│ │ │ └─────────────────────────┘ │ │
│ │ │ ████ New (1)        │                     │ │ │                             │ │
│ │ │ $450 avg            │ Robert Wilson       │ │ │ ⚡ Quick Actions:           │ │
│ │ │                     │ Dormant 90+ days    │ │ │ • Email at-risk customers   │ │
│ │ │ ████ At Risk (2)    │ Re-engagement needed│ │ │ • Export VIP list          │ │
│ │ │ $1,575 avg          │                     │ │ │ • Create retention campaign │ │
│ │ └─────────────────────┴─────────────────────┘ │ │                             │ │
│ │                                             │ │ 📊 Dashboard Controls:      │ │
│ │ ┌─────────────────────────────────────────┐   │ │ • Filter by segment         │ │
│ │ │ Top Segments Performance                │   │ │ • Show trends              │ │
│ │ │ VIP_HIGH_VALUE    │ 1 │ $8,500 │ 5%    │   │ │ • Highlight alerts         │ │
│ │ │ BUSINESS_PROF     │ 1 │ $4,800 │ 10%   │   │ │                             │ │
│ │ │ HIGH_AOV          │ 1 │ $3,600 │ 15%   │   │ │ 🔄 Live Updates            │ │
│ │ │ FASHION_ENT       │ 1 │ $3,400 │ 15%   │   │ │ • Real-time alerts         │ │
│ │ │ [View All Segments]                     │   │ │ • Status changes           │ │
│ │ └─────────────────────────────────────────┘   │ │ • New customer activity    │ │
│ └─────────────────────────────────────────────┘ └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 **Responsive Layouts**

### **Tablet Layout (1024x768)**
```
┌─────────────────────────────────────────────────────────┐
│ 🛡️ Scudo Intelligence    [🔍] [👤] [⚙️]                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                DASHBOARD (Full Width)               │ │
│ │ ┌─────────┬─────────┬─────────┬─────────┐           │ │
│ │ │ Total:10│Active:7 │At Risk:2│Rev:$28K │           │ │
│ │ └─────────┴─────────┴─────────┴─────────┘           │ │
│ │                                                     │ │
│ │ ┌─────────────────┬─────────────────────────────────┐ │ │
│ │ │ Health          │ Alerts                          │ │ │
│ │ │ VIP (1) $8.5K   │ Lisa Thompson - 30% risk        │ │ │
│ │ │ Active (3)      │ Mike Johnson - 25% risk         │ │ │
│ │ └─────────────────┴─────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 💬 CHAT INTERFACE (Collapsible)                     │ │
│ │ [Expand Chat] Ask: "Why is Lisa at risk?"           │ │
│ │ 🎯 Suggestions: VIP growth | Retention strategy     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### **Mobile Layout (375x667)**
```
┌─────────────────────────────┐
│ 🛡️ Scudo    [☰] [🔍] [👤]    │
├─────────────────────────────┤
│                             │
│ ┌─────────┬─────────────────┐ │
│ │ Total   │ At Risk         │ │
│ │   10    │    2            │ │
│ └─────────┴─────────────────┘ │
│                             │
│ ┌─────────────────────────┐   │
│ │ 🚨 Immediate Attention  │   │
│ │ Lisa Thompson (30%)     │   │
│ │ Mike Johnson (25%)      │   │
│ │ [View Details]          │   │
│ └─────────────────────────┘   │
│                             │
│ ┌─────────────────────────┐   │
│ │ 💬 Quick Chat           │   │
│ │ "Show at-risk customers"│   │
│ │ [Send] [🎤]             │   │
│ └─────────────────────────┘   │
│                             │
│ [Dashboard] [Chat] [Profile]│
└─────────────────────────────┘
```

---

## 🎯 **Detailed Component Wireframes**

### **KPI Cards Component**
```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌─────────────┬─────────────┬─────────────┬─────────────────────────┐ │
│ │ 👥 TOTAL    │ ✅ ACTIVE   │ ⚠️ AT RISK   │ 💰 REVENUE             │ │
│ │ CUSTOMERS   │ CUSTOMERS   │ CUSTOMERS   │ THIS MONTH             │ │
│ │             │             │             │                        │ │
│ │     10      │      7      │      2      │      $28,450           │ │
│ │   +2 ↗️      │    +1 ↗️     │    +1 ⚠️     │     +12% ↗️             │ │
│ │             │             │             │                        │ │
│ │ [Click for  │ [Click for  │ [Click for  │ [Click for trends]     │ │
│ │  details]   │  list]      │  alerts]    │                        │ │
│ └─────────────┴─────────────┴─────────────┴─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

Interactions:
- Click any card → Dashboard filters to that data
- Hover → Shows trend tooltip
- Click trend arrow → Opens trend analysis in chat
```

### **Customer Health Distribution**
```
┌─────────────────────────────────────────────────────────────────────┐
│ 📊 CUSTOMER HEALTH DISTRIBUTION                                     │
│                                                                     │
│ VIP (1 customer)                                                    │
│ ████████ $8,500 avg │ 5% churn risk │ [💬 Ask about VIP growth]     │
│                                                                     │
│ Active (3 customers)                                                │
│ ██████████████ $3,133 avg │ 15% avg risk │ [💬 Analyze performance] │
│                                                                     │
│ New (1 customer)                                                    │
│ ████ $450 avg │ 30% churn risk │ [💬 Improve onboarding]            │
│                                                                     │
│ At Risk (2 customers)                                               │
│ ██████ $1,575 avg │ 27.5% avg risk │ [💬 Retention strategy]        │
│                                                                     │
│ Dormant (1 customer)                                                │
│ ████ $1,800 avg │ 90+ days inactive │ [💬 Re-engagement plan]       │
│                                                                     │
│ [View Detailed Breakdown] [Export Data] [Set Alerts]               │
└─────────────────────────────────────────────────────────────────────┘

Interactions:
- Click any segment bar → Filters dashboard to that segment
- Click chat buttons → Opens relevant conversation in chat
- Hover → Shows detailed metrics tooltip
```

### **Alerts Panel**
```
┌─────────────────────────────────────────────────────────────────────┐
│ 🚨 IMMEDIATE ATTENTION REQUIRED                                     │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ⚠️ Lisa Thompson                                    30% risk    │ │
│ │ Price-sensitive segment │ 45 days since purchase               │ │
│ │ [💬 Why at risk?] [📧 Send offer] [📞 Schedule call]           │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ⚠️ Mike Johnson                                     25% risk    │ │
│ │ Regular segment │ Declining order frequency                    │ │
│ │ [💬 Retention plan] [📧 Loyalty invite] [📊 Analyze trends]    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 💤 Robert Wilson                                   Dormant     │ │
│ │ 90+ days inactive │ Previously active customer                 │ │
│ │ [💬 Re-engage how?] [📧 Win-back campaign] [📞 Personal call]  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ [Create Bulk Campaign] [Export Alert List] [Set New Thresholds]    │
└─────────────────────────────────────────────────────────────────────┘

Interactions:
- Click customer name → Opens customer 360 view
- Click chat buttons → Starts relevant conversation
- Click action buttons → Opens workflow in chat
```

### **Chat Interface Component**
```
┌─────────────────────────────────────────────────────────────────────┐
│ 💬 ASK ABOUT YOUR CUSTOMERS                                         │
│                                                                     │
│ 🎯 CONTEXTUAL SUGGESTIONS (based on visible dashboard data):        │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ • Why is Lisa Thompson at 30% churn risk?                      │ │
│ │ • How can I retain Mike Johnson?                                │ │
│ │ • What makes customers become VIP?                              │ │
│ │ • Show me business professional segment details                 │ │
│ │ • Create retention campaign for at-risk customers               │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ 💬 CONVERSATION:                                                    │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ User: Show VIP customers                                        │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ AI: Found 1 VIP customer:                                       │ │
│ │ • David Kim - 45 orders, $8,500 spent, 5% churn risk          │ │
│ │ • RFM Score: 555 (Excellent across all metrics)                │ │
│ │ • Last purchase: 3 days ago                                    │ │
│ │                                                                 │ │
│ │ [View Full Profile] [Analyze Behavior] [Create VIP Campaign]   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ⚡ QUICK ACTIONS:                                                   │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ [📧 Email at-risk] [📊 Export VIP] [🎯 Create campaign]         │ │
│ │ [📞 Schedule calls] [📈 Show trends] [🔍 Advanced search]       │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ 📊 DASHBOARD CONTROLS:                                              │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ [🎯 Filter by VIP] [⚠️ Show alerts] [📈 Revenue focus]          │ │
│ │ [🔄 Refresh data] [💾 Save view] [📤 Share insights]            │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Type your question... [Send] [🎤] [📎]                          │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

Interactions:
- Click suggestions → Starts that conversation
- Chat responses include action buttons
- Quick actions execute immediately
- Dashboard controls update left panel in real-time
```

---

## 🔄 **Interaction Flow Wireframes**

### **Flow 1: Alert Investigation**
```
Step 1: Dashboard shows alert
┌─────────────────────────┐    ┌─────────────────────────┐
│ 🚨 Lisa Thompson        │    │ 💬 Chat Interface       │
│ 30% churn risk ⚠️        │    │                         │
│ [💬 Why at risk?] ←──────┼────→ Suggestion appears     │
└─────────────────────────┘    └─────────────────────────┘

Step 2: User clicks "Why at risk?"
┌─────────────────────────┐    ┌─────────────────────────┐
│ Lisa highlighted        │    │ AI: Lisa's risk factors:│
│ Profile shows details   │    │ • 45 days no purchase   │
│                         │    │ • Price-sensitive       │
└─────────────────────────┘    │ • Declining frequency   │
                               │ [Send retention offer]  │
                               └─────────────────────────┘

Step 3: Action execution
┌─────────────────────────┐    ┌─────────────────────────┐
│ Alert updated with      │    │ Retention email created │
│ "Action taken" status   │    │ [Review] [Send] [Edit]  │
└─────────────────────────┘    └─────────────────────────┘
```

### **Flow 2: Segment Analysis**
```
Step 1: Click VIP segment
┌─────────────────────────┐    ┌─────────────────────────┐
│ VIP segment highlighted │    │ 💬 "Analyze VIP segment"│
│ Shows: 1 customer       │    │ suggestion appears      │
│ $8,500 avg value        │    │                         │
└─────────────────────────┘    └─────────────────────────┘

Step 2: Chat analysis
┌─────────────────────────┐    ┌─────────────────────────┐
│ Dashboard filters to    │    │ AI: VIP Analysis:       │
│ show only VIP customers │    │ • 1 customer (David K.) │
│ David Kim profile shown │    │ • $8,500 value         │
└─────────────────────────┘    │ • 5% churn risk        │
                               │ • Growth opportunity... │
                               └─────────────────────────┘

Step 3: Growth planning
┌─────────────────────────┐    ┌─────────────────────────┐
│ Shows potential VIP     │    │ Growth strategy:        │
│ customers highlighted   │    │ • Target 2 customers    │
│ James & Sarah profiles  │    │ • Upsell campaigns      │
└─────────────────────────┘    │ [Create VIP campaign]   │
                               └─────────────────────────┘
```

---

## 🎨 **Visual Design Elements**

### **Color Scheme**
```
Primary Colors:
- Scudo Blue: #2563EB (headers, primary actions)
- Success Green: #10B981 (positive metrics, VIP)
- Warning Orange: #F59E0B (at-risk, attention needed)
- Danger Red: #EF4444 (high risk, critical alerts)
- Neutral Gray: #6B7280 (text, borders)

Background Colors:
- Dashboard: #F9FAFB (light gray)
- Chat: #FFFFFF (white)
- Cards: #FFFFFF with subtle shadows
- Alerts: #FEF3C7 (light yellow background)
```

### **Typography**
```
Headers: Inter Bold, 18-24px
Body Text: Inter Regular, 14-16px
Metrics: Inter SemiBold, 20-32px
Chat: Inter Regular, 14px
Buttons: Inter Medium, 14px
```

### **Icons & Visual Elements**
```
Status Icons:
- 👥 Customers
- ✅ Active/Healthy
- ⚠️ At Risk
- 🚨 Critical Alert
- 💰 Revenue
- 📊 Analytics
- 💬 Chat
- 🎯 Targeting
- 📧 Email
- 📞 Phone

Interactive Elements:
- Hover states with subtle shadows
- Click animations (scale 0.95)
- Loading spinners for AI responses
- Progress bars for streaming responses
```

This wireframe design creates a cohesive, professional workspace that seamlessly integrates dashboard intelligence with conversational AI, optimized for SMB customer intelligence workflows.

**Ready to start implementing these designs in Week 1?**
