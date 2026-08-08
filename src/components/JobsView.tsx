import React, { useState } from 'react';
import { Briefcase, MapPin, Search, ExternalLink, Building2, DollarSign } from 'lucide-react';
import { MOCK_JOBS } from '../data/mockData';

export const JobsView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);

  const filtered = MOCK_JOBS.filter(
    (job) =>
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.company.toLowerCase().includes(query.toLowerCase()) ||
      job.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
  );

  const toggleApply = (jobId: string) => {
    if (appliedJobs.includes(jobId)) {
      setAppliedJobs(appliedJobs.filter((id) => id !== jobId));
    } else {
      setAppliedJobs([...appliedJobs, jobId]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Developer Jobs & Opportunities
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore curated roles from top engineering teams hiring React, Node.js, Rust, and AI talent.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by role, company, or tech stack..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          id="jobs-search-input"
        />
      </div>

      {/* Jobs List */}
      <div className="space-y-4" id="jobs-list">
        {filtered.map((job) => {
          const isApplied = appliedJobs.includes(job.id);
          return (
            <div
              key={job.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4"
              id={`job-card-${job.id}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-orange-500 font-extrabold text-lg shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{job.company}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.location}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <DollarSign className="w-3.5 h-3.5" />
                        {job.salary}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleApply(job.id)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all shrink-0 ${
                    isApplied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
                  }`}
                  id={`apply-job-btn-${job.id}`}
                >
                  {isApplied ? 'Application Sent ✓' : 'Quick Apply'}
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {job.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {job.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
