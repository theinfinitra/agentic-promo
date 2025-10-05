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

interface SpatialCustomerViewProps {
  customers: Customer[];
  onCustomerSelect: (customer: Customer) => void;
  selectedCustomer: Customer | null;
  colors: Record<string, string>;
}

export const SpatialCustomerView: React.FC<SpatialCustomerViewProps> = ({
  customers,
  onCustomerSelect,
  selectedCustomer,
  colors
}) => {
  const [hoveredCustomer, setHoveredCustomer] = useState<string | null>(null);

  const getCustomerLayer = (customer: Customer) => {
    if (customer.lifecycleStage === 'VIP') return 'vip';
    if (customer.churnRisk > 0.25) return 'at-risk';
    if (customer.lifecycleStage === 'Active') return 'active';
    if (customer.lifecycleStage === 'New') return 'new';
    return 'dormant';
  };

  const getCustomerColor = (customer: Customer) => {
    const layer = getCustomerLayer(customer);
    switch (layer) {
      case 'vip': return colors.growth;
      case 'at-risk': return colors.warning;
      case 'active': return colors.success;
      case 'new': return colors.primary;
      case 'dormant': return colors.inactive;
      default: return colors.neutral;
    }
  };

  const getLayerTransform = (customer: Customer) => {
    const layer = getCustomerLayer(customer);
    switch (layer) {
      case 'vip': return 'translateZ(-50px) translateY(-30px)';
      case 'at-risk': return 'translateZ(50px) translateY(30px)';
      case 'active': return 'translateZ(0px) translateY(0px)';
      case 'new': return 'translateZ(20px) translateY(10px)';
      case 'dormant': return 'translateZ(80px) translateY(50px)';
      default: return 'translateZ(0px) translateY(0px)';
    }
  };

  const getRiskIndicator = (churnRisk: number) => {
    if (churnRisk > 0.25) return '🚨';
    if (churnRisk > 0.15) return '⚠️';
    return '✅';
  };

  return (
    <div className="relative h-full rounded-lg border" style={{ backgroundColor: colors.dark, borderColor: colors.primary }}>
      {/* 3D Container */}
      <div 
        className="relative w-full h-full overflow-hidden"
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Layer Labels */}
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <div className="text-sm font-medium" style={{ color: colors.light }}>
            🌐 Customer Universe
          </div>
          <div className="text-xs space-y-1" style={{ color: colors.neutral }}>
            <div>⭐ VIP Layer (Top)</div>
            <div>🟢 Active Layer</div>
            <div>🔴 At-Risk Layer</div>
            <div>⚫ Dormant Layer (Bottom)</div>
          </div>
        </div>

        {/* 3D Customer Space */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateX(10deg) rotateY(5deg)'
          }}
        >
          {customers.map((customer, index) => {
            const isHovered = hoveredCustomer === customer.id;
            const isSelected = selectedCustomer?.id === customer.id;
            const customerColor = getCustomerColor(customer);
            const layer = getCustomerLayer(customer);

            return (
              <div
                key={customer.id}
                className={`absolute cursor-pointer transition-all duration-300 ${
                  isHovered || isSelected ? 'scale-110' : 'scale-100'
                }`}
                style={{
                  transform: `${getLayerTransform(customer)} translateX(${(index - 1) * 120}px)`,
                  transformStyle: 'preserve-3d'
                }}
                onMouseEnter={() => setHoveredCustomer(customer.id)}
                onMouseLeave={() => setHoveredCustomer(null)}
                onClick={() => onCustomerSelect(customer)}
              >
                {/* Customer Node */}
                <div
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-2 ${
                    layer === 'at-risk' ? 'animate-pulse' : ''
                  }`}
                  style={{
                    backgroundColor: customerColor,
                    borderColor: isSelected ? colors.light : 'transparent',
                    boxShadow: `0 4px 20px ${customerColor}40`
                  }}
                >
                  {/* Customer Avatar */}
                  <div className="text-2xl">
                    {customer.lifecycleStage === 'VIP' ? '⭐' : '👤'}
                  </div>

                  {/* Risk Indicator */}
                  <div className="absolute -top-2 -right-2 text-lg">
                    {getRiskIndicator(customer.churnRisk)}
                  </div>

                  {/* Connection Lines (for VIP/At-Risk) */}
                  {(layer === 'vip' || layer === 'at-risk') && (
                    <div
                      className="absolute w-px opacity-50"
                      style={{
                        height: '60px',
                        backgroundColor: customerColor,
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)'
                      }}
                    />
                  )}
                </div>

                {/* Customer Label */}
                <div
                  className="absolute top-24 left-1/2 transform -translate-x-1/2 text-center min-w-max"
                  style={{
                    transform: 'translateX(-50%) rotateX(-10deg) rotateY(-5deg)'
                  }}
                >
                  <div className="text-sm font-medium" style={{ color: colors.light }}>
                    {customer.name}
                  </div>
                  <div className="text-xs" style={{ color: colors.neutral }}>
                    ${customer.totalSpent.toLocaleString()}
                  </div>
                  {customer.churnRisk > 0.2 && (
                    <div className="text-xs font-medium" style={{ color: colors.warning }}>
                      {Math.round(customer.churnRisk * 100)}% risk
                    </div>
                  )}
                </div>

                {/* Hover Details */}
                {isHovered && (
                  <div
                    className="absolute top-28 left-1/2 transform -translate-x-1/2 p-3 rounded-lg shadow-lg border z-20 min-w-max"
                    style={{
                      backgroundColor: colors.light,
                      borderColor: colors.primary,
                      transform: 'translateX(-50%) rotateX(-10deg) rotateY(-5deg)'
                    }}
                  >
                    <div className="text-sm space-y-1">
                      <div className="font-medium" style={{ color: colors.dark }}>
                        {customer.name}
                      </div>
                      <div style={{ color: colors.neutral }}>
                        📧 {customer.email}
                      </div>
                      <div style={{ color: colors.neutral }}>
                        💰 ${customer.totalSpent.toLocaleString()} total
                      </div>
                      <div style={{ color: colors.neutral }}>
                        📅 Last: {new Date(customer.lastPurchase).toLocaleDateString()}
                      </div>
                      <div style={{ color: colors.neutral }}>
                        🏷️ {customer.segment.replace('_', ' ')}
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex space-x-2 mt-2 pt-2 border-t" style={{ borderColor: colors.neutral }}>
                        <button
                          className="px-2 py-1 text-xs rounded hover:opacity-80"
                          style={{ backgroundColor: colors.primary, color: colors.light }}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Email', customer.name);
                          }}
                        >
                          📧 Email
                        </button>
                        <button
                          className="px-2 py-1 text-xs rounded hover:opacity-80"
                          style={{ backgroundColor: colors.success, color: colors.light }}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Analyze', customer.name);
                          }}
                        >
                          📊 Analyze
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Ambient Particles (Optional Enhancement) */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full opacity-30 animate-pulse"
              style={{
                backgroundColor: colors.growth,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 right-4 text-xs" style={{ color: colors.neutral }}>
          <div>🖱️ Click customer for details</div>
          <div>👆 Hover for quick actions</div>
        </div>
      </div>
    </div>
  );
};
