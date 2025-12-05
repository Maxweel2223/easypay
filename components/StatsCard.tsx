import React from 'react';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, trend, trendUp, icon: Icon, color }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          {trendUp ? (
            <ArrowUpRight size={16} className="text-emerald-500 mr-1" />
          ) : (
            <ArrowDownRight size={16} className="text-red-500 mr-1" />
          )}
          <span className={trendUp ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
            {trend}
          </span>
          <span className="text-gray-400 ml-1">vs mês anterior</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;