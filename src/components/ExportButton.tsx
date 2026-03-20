'use client';

import React, { useState } from 'react';

type Props = {
  onExport: () => Promise<void>;
  disabled?: boolean;
};

export const ExportButton: React.FC<Props> = ({ onExport, disabled }) => {
  const [exporting, setExporting] = useState(false);

  const handleClick = async () => {
    setExporting(true);
    try {
      await onExport();
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || exporting}
      style={{
        padding: '10px 24px',
        borderRadius: 8,
        border: 'none',
        background: disabled || exporting ? '#333' : 'linear-gradient(135deg, #ff8ea0, #ff6b6b)',
        color: '#fff',
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled || exporting ? 'not-allowed' : 'pointer',
        opacity: disabled || exporting ? 0.5 : 1,
        transition: 'all 0.2s',
      }}
    >
      {exporting ? 'Rendering...' : 'Export Video'}
    </button>
  );
};
