import React from 'react';

type PlaceholderPageProps = {
  label: string;
};

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ label }) => (
  <div className="py-16 text-center">
    <p className="font-serif text-xl text-slate-400">{label}</p>
    <p className="text-[10px] uppercase tracking-widest text-slate-300 mt-2">Coming soon</p>
  </div>
);

export default PlaceholderPage;
