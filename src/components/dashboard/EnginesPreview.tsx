import React from 'react';
import { EngineHub } from '../engines/EngineHub';

interface EnginesPreviewProps {
  onSelectEngine?: (engineId: string) => void;
}

export const EnginesPreview: React.FC<EnginesPreviewProps> = ({ onSelectEngine }) => {
  return <EngineHub onSelectEngine={onSelectEngine || (() => {})} />;
};
