'use client'

import React from 'react';
import { Zap } from 'lucide-react';

const StatusBar: React.FC = () => (
  <div className="h-10 flex items-center justify-between px-6 text-xs font-medium text-slate-400">
    <div className="flex items-center gap-2">
      <span>9:41</span>
      <Zap size={10} fill="currentColor" className="text-slate-200" />
    </div>
    <div className="w-5 h-2.5 border border-slate-200 rounded-sm" />
  </div>
);

export default StatusBar;
