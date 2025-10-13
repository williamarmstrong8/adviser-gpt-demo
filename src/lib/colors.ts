// Centralized color configuration for highlighting system
// Change these values to update colors across the entire application

export const HIGHLIGHT_COLORS = {
  // AI-generated content colors
  ai: {
    background: 'bg-yellow-100',
    border: 'border-yellow-300',
    hover: 'hover:bg-yellow-200',
    text: 'text-yellow-800',
    accent: 'text-yellow-600',
    indicator: 'bg-yellow-500', // For legend dots/bars
    underline: 'decoration-yellow-300', // If we ever need AI underlines
    underlineHover: 'hover:decoration-yellow-500',
  },
  
  // Vault source content colors
  vault: {
    background: 'bg-blue-50',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-100',
    text: 'text-blue-800',
    accent: 'text-blue-600',
    indicator: 'bg-blue-500', // For legend dots/bars
    underline: 'decoration-gray-400',
    underlineHover: 'hover:decoration-blue-600',
  }
} as const;

// Helper function to get source number color
export const getSourceNumberColor = (sourceIndex: number) => {
  const colors = [
    'bg-blue-500', 'bg-blue-600', 'bg-blue-700', 'bg-blue-800',
    'bg-indigo-500', 'bg-indigo-600', 'bg-indigo-700', 'bg-indigo-800',
    'bg-purple-500', 'bg-purple-600', 'bg-purple-700', 'bg-purple-800'
  ];
  return colors[sourceIndex % colors.length];
};
