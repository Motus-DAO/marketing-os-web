"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ProjectCard } from "@/components/dashboard/project-card";
import { EmptyState } from "@/components/ui/empty-state";

export default function HomePage() {
  const projects = useQuery(api.dashboard.listProjects);
  const createProject = useMutation(api.projects.createProject);
  const [isCreatingVideoProject, setIsCreatingVideoProject] = useState(false);

  const hasVideoProject = useMemo(
    () => (projects ?? []).some((project: any) => String(project.name ?? "").toLowerCase().includes("video")),
    [projects],
  );

  async function handleCreateVideoProject() {
    if (hasVideoProject) return;
    setIsCreatingVideoProject(true);
    try {
      const now = new Date().toISOString();
      await createProject({
        name: "MotusDAO Videos",
        slug: "motusdao-videos",
        description: "Video review and iteration set for MotusDAO.",
        status: "active",
        primaryGoals: ["Review founder videos", "Review AI video outputs"],
        primaryMonetizationPath: "Carousel/video/ads → free masterclass → nurture → paid course sale",
        activeChannels: ["instagram", "meta_ads"],
        createdAt: now,
        updatedAt: now,
      });
    } finally {
      setIsCreatingVideoProject(false);
    }
  }

  if (projects === undefined) {
    return <div className="loading-state">Loading projects…</div>;
  }

  return (
    <section className="page-stack">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Project Home</p>
          <h1>Select a project</h1>
          <p className="muted">Next.js rebuild of the internal asset review dashboard.</p>
        </div>
        {!hasVideoProject ? (
          <button className="primary-button" type="button" onClick={handleCreateVideoProject} disabled={isCreatingVideoProject}>
            {isCreatingVideoProject ? "Creating video project…" : "Add video workflow"}
          </button>
        ) : null}
      </div>
      {hasVideoProject ? <p className="muted">Video project created. Next step is registering at least one video asset/version into Convex so it appears in review.</p> : null}
      {projects.length ? (
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      ) : (
        <EmptyState title="No projects yet" body="Create or seed projects in Convex to start reviewing assets." />
      )}
    </section>
  );
}
