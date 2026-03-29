import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { startOfDay, subDays, addDays, format, isSameDay } from 'date-fns';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { State } from 'ts-fsrs';
import { ArrowLeft, Activity, Calendar, BrainCircuit } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

export function StatsView({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  
  const stats = useLiveQuery(async () => {
    const today = startOfDay(new Date());
    
    // 1. Learning Status (Review History - Last 14 days)
    const last14Days = Array.from({ length: 14 }).map((_, i) => {
      const d = subDays(today, 13 - i);
      return { date: d, label: format(d, 'MM/dd'), reviews: 0 };
    });
    
    // Heatmap data (Last 90 days)
    const startDate = subDays(today, 89);
    const startDayOfWeek = startDate.getDay(); // 0 = Sunday
    
    const heatmapDays = Array.from({ length: 90 }).map((_, i) => {
      const d = addDays(startDate, i);
      return { date: d, count: 0 };
    });
    
    const logs = await db.reviewLogs
      .where('review_time')
      .aboveOrEqual(startDate)
      .toArray();
      
    logs.forEach(log => {
      const logDay = startOfDay(log.review_time);
      
      // For 14 days chart
      const day14 = last14Days.find(d => isSameDay(d.date, logDay));
      if (day14) day14.reviews++;
      
      // For heatmap
      const mapDay = heatmapDays.find(d => isSameDay(d.date, logDay));
      if (mapDay) mapDay.count++;
    });

    // 2. Memory Stability & States
    const cards = await db.cards.toArray();
    const learnedCards = cards.filter(c => c.state === State.Review || c.state === State.Relearning);
    
    const stabilityGroups = {
      '< 1d': 0,
      '1-3d': 0,
      '3-7d': 0,
      '7-14d': 0,
      '14-30d': 0,
      '> 30d': 0,
    };
    
    let totalStability = 0;
    
    learnedCards.forEach(c => {
      totalStability += c.stability;
      if (c.stability < 1) stabilityGroups['< 1d']++;
      else if (c.stability < 3) stabilityGroups['1-3d']++;
      else if (c.stability < 7) stabilityGroups['3-7d']++;
      else if (c.stability < 14) stabilityGroups['7-14d']++;
      else if (c.stability < 30) stabilityGroups['14-30d']++;
      else stabilityGroups['> 30d']++;
    });
    
    const stabilityData = Object.entries(stabilityGroups).map(([name, count]) => ({ name, count }));
    
    // 3. Forgetting Curve
    const avgStability = learnedCards.length > 0 ? totalStability / learnedCards.length : 2;
    const forgettingCurve = Array.from({ length: 31 }).map((_, day) => {
      const retention = Math.pow(1 + day / (9 * avgStability), -1);
      return { day, retention: Math.round(retention * 100) };
    });

    // States
    const stateCounts = {
      [State.New]: 0,
      [State.Learning]: 0,
      [State.Review]: 0,
      [State.Relearning]: 0,
    };
    
    let dueToday = 0;
    
    // 5. Upcoming Reviews (Next 14 days)
    const next14Days = Array.from({ length: 14 }).map((_, i) => {
      const d = addDays(today, i);
      return { date: d, label: format(d, 'MM/dd'), count: 0 };
    });

    cards.forEach(card => {
      stateCounts[card.state]++;
      if (card.state !== State.New) {
        let dueDay = startOfDay(card.due);
        if (dueDay < today) dueDay = today; // Count overdue cards as due today
        
        if (isSameDay(dueDay, today)) {
          dueToday++;
        }
        
        const day14 = next14Days.find(d => isSameDay(d.date, dueDay));
        if (day14) day14.count++;
      }
    });

    const stateData = [
      { name: t('stats.stateNew'), value: stateCounts[State.New], color: '#3b82f6' },
      { name: t('stats.stateLearning'), value: stateCounts[State.Learning], color: '#f59e0b' },
      { name: t('stats.stateReview'), value: stateCounts[State.Review], color: '#10b981' },
      { name: t('stats.stateRelearning'), value: stateCounts[State.Relearning], color: '#ef4444' },
    ].filter(d => d.value > 0);

    return {
      learningStatus: last14Days,
      heatmapDays,
      startDayOfWeek,
      stabilityData,
      forgettingCurve,
      upcomingReviews: next14Days,
      states: stateData,
      totalCards: cards.length,
      totalReviews: await db.reviewLogs.count(),
      dueToday
    };
  }, [t]); // Re-run when translation changes

  if (!stats) return <div className="flex justify-center p-12">{t('home.loading')}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{t('stats.title')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={<BrainCircuit className="text-blue-500" />} title={t('stats.totalCards')} value={stats.totalCards} />
        <StatCard icon={<Activity className="text-green-500" />} title={t('stats.totalReviews')} value={stats.totalReviews} />
        <StatCard icon={<Calendar className="text-orange-500" />} title={t('stats.dueToday')} value={stats.dueToday} />
      </div>

      {/* 0. Activity Heatmap */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('stats.activityHeatmap')}</h2>
        <div className="flex flex-col items-center">
          <div className="flex gap-1 overflow-x-auto pb-4 w-full justify-start md:justify-center">
            <div className="grid grid-rows-7 grid-flow-col gap-1">
              {Array.from({ length: stats.startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="w-3 h-3 md:w-4 md:h-4 rounded-sm bg-transparent" />
              ))}
              {stats.heatmapDays.map((day, i) => {
                let colorClass = "bg-gray-100";
                if (day.count > 0) colorClass = "bg-blue-200";
                if (day.count > 10) colorClass = "bg-blue-400";
                if (day.count > 30) colorClass = "bg-blue-600";
                if (day.count > 50) colorClass = "bg-blue-800";
                
                return (
                  <div 
                    key={i} 
                    className={`w-3 h-3 md:w-4 md:h-4 rounded-sm ${colorClass} transition-colors hover:ring-2 hover:ring-gray-400`}
                    title={`${format(day.date, 'MMM dd, yyyy')}: ${day.count} ${t('stats.reviews')}`}
                  />
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 self-end">
            <span>{t('stats.less')}</span>
            <div className="w-3 h-3 rounded-sm bg-gray-100" />
            <div className="w-3 h-3 rounded-sm bg-blue-200" />
            <div className="w-3 h-3 rounded-sm bg-blue-400" />
            <div className="w-3 h-3 rounded-sm bg-blue-600" />
            <div className="w-3 h-3 rounded-sm bg-blue-800" />
            <span>{t('stats.more')}</span>
          </div>
        </div>
      </div>

      {/* 1. Forgetting Curve and Upcoming Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('stats.forgettingCurve')}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.forgettingCurve}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '3 3' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  formatter={(value: number) => [`${value}%`, t('stats.retention')]}
                  labelFormatter={(label) => `${label} ${t('stats.days')}`}
                />
                <Line type="monotone" dataKey="retention" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('stats.upcomingReviews')}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.upcomingReviews}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [value, t('stats.cardCount')]} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 2. Learning Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('stats.learningStatus')}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.learningStatus}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [value, t('stats.reviews')]} />
                <Bar dataKey="reviews" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Memory Stability */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('stats.memoryStability')}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.stabilityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [value, t('stats.cardCount')]} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Card States */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('stats.stateDistribution')}</h2>
        {stats.states.length > 0 ? (
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.states}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.states.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 ml-8">
              {stats.states.map(state => (
                <div key={state.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: state.color }} />
                  <span className="text-sm text-gray-600">{state.name}</span>
                  <span className="text-sm font-semibold text-gray-900 ml-auto">{state.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            {t('stats.noData')}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: number }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className="p-3 bg-gray-50 rounded-lg">
        {icon}
      </div>
      <div>
        <div className="text-sm text-gray-500 mb-1">{title}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

