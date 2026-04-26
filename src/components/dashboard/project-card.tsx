import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";

export function ProjectCard({ project }: { project: any }) {
  return (
    <Link href={`/projects/${project._id}`} className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Project</p>
          <h3>{project.name}</h3>
        </div>
        <StatusBadge value={project.status} tone={project.status === "active" ? "success" : "neutral"} />
      </div>
      <p className="muted">{project.description || "No description yet."}</p>
      <div className="card-stats">
        <div>
          <strong>{project.assetCount ?? 0}</strong>
          <span className="muted">Total assets</span>
        </div>
        <div>
          <strong>{project.inReviewCount ?? 0}</strong>
          <span className="muted">Needs review</span>
        </div>
      </div>
    </Link>
  );
}
