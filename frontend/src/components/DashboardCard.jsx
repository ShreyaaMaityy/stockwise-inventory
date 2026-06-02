import React from 'react';

const DashboardCard = ({ title, value, icon: Icon, color = 'sky', loading = false }) => {
  const colorMap = {
    sky: {
      bg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
      glow: 'shadow-sky-500/5',
    },
    emerald: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      glow: 'shadow-emerald-500/5',
    },
    indigo: {
      bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
      glow: 'shadow-indigo-500/5',
    },
    rose: {
      bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      glow: 'shadow-rose-500/5',
    },
  };

  const theme = colorMap[color] || colorMap.sky;

  return (
    <div className={`p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md shadow-lg ${theme.glow} transition-all duration-300 hover:border-slate-700/60 hover:-translate-y-1`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-400 tracking-wider uppercase">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-slate-800 rounded-lg animate-pulse mt-2" />
          ) : (
            <p className="text-3xl font-extrabold text-white mt-2 tracking-tight">{value}</p>
          )}
        </div>
        <div className={`p-3.5 rounded-xl border ${theme.bg}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
