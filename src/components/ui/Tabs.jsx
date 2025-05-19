import React, { useState, createContext, useContext } from 'react';

// Create context for tab state management
const TabsContext = createContext(null);

export function Tabs({ defaultValue, className, children, onValueChange, ...props }) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={`tabs ${className || ''}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children, ...props }) {
  return (
    <div 
      className={`inline-flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-1 rounded-md ${className || ''}`}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, children, ...props }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;
  
  return (
    <button
      role="tab"
      aria-selected={isActive}
      className={`
        px-3 py-1.5 text-sm font-medium rounded-md transition-all
        ${isActive 
          ? 'bg-white dark:bg-gray-700 shadow-sm' 
          : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
        } 
        ${className || ''}
      `}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children, ...props }) {
  const { activeTab } = useContext(TabsContext);
  
  if (value !== activeTab) {
    return null;
  }
  
  return (
    <div 
      role="tabpanel"
      className={`mt-2 ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}
