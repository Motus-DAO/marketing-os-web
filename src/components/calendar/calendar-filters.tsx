import {
  CALENDAR_DISTRIBUTION_TYPES,
  CALENDAR_PLATFORMS,
  CALENDAR_STATUSES,
} from "@/lib/calendar-constants";

type ProjectOption = { _id: string; name: string };

type FilterProps = {
  platform: string;
  status: string;
  distributionType: string;
  projectId: string;
  projects: ProjectOption[];
  onPlatformChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDistributionChange: (value: string) => void;
  onProjectChange: (value: string) => void;
};

export function CalendarFilters({
  platform,
  status,
  distributionType,
  projectId,
  projects,
  onPlatformChange,
  onStatusChange,
  onDistributionChange,
  onProjectChange,
}: FilterProps) {
  return (
    <div className="calendar-filters panel">
      <div className="filter-group">
        <label htmlFor="project-filter">Project</label>
        <select id="project-filter" value={projectId} onChange={(e) => onProjectChange(e.target.value)}>
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label htmlFor="platform-filter">Platform</label>
        <select id="platform-filter" value={platform} onChange={(e) => onPlatformChange(e.target.value)}>
          <option value="all">All</option>
          {CALENDAR_PLATFORMS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label htmlFor="status-filter">Status</label>
        <select id="status-filter" value={status} onChange={(e) => onStatusChange(e.target.value)}>
          <option value="all">All</option>
          {CALENDAR_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label htmlFor="distribution-filter">Organic / Paid</label>
        <select
          id="distribution-filter"
          value={distributionType}
          onChange={(e) => onDistributionChange(e.target.value)}
        >
          <option value="all">All</option>
          {CALENDAR_DISTRIBUTION_TYPES.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
