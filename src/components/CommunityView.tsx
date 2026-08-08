import React, { useState } from 'react';
import { Users, Award, Search, MapPin, Globe, Sparkles } from 'lucide-react';
import { User } from '../types';

interface CommunityViewProps {
  users: User[];
}

export const CommunityView: React.FC<CommunityViewProps> = ({ users }) => {
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.topTech.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          DevFlow Community Leaderboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Top software engineers, open source authors, and AI developers contributing solutions.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search developers by name, username, or stack..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          id="community-search-input"
        />
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="community-users-grid">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all flex flex-col justify-between space-y-4"
            id={`user-card-${user.id}`}
          >
            <div className="flex items-start gap-3.5">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-orange-500/30"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                    {user.name}
                  </h3>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {user.reputation.toLocaleString()} rep
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">@{user.username}</div>
                
                {user.location && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{user.location}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {user.bio}
            </p>

            {/* Badges & Tech Stack */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="text-amber-500">🥇 {user.badges.gold}</span>
                <span className="text-slate-400">🥈 {user.badges.silver}</span>
                <span className="text-amber-700 dark:text-amber-600">🥉 {user.badges.bronze}</span>
              </div>

              <div className="flex flex-wrap gap-1">
                {user.topTech.map((tech) => (
                  <span
                    key={tech}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
