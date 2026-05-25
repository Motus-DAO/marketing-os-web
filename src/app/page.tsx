"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ProjectCard } from "@/components/dashboard/project-card";
import { EmptyState } from "@/components/ui/empty-state";
import { MASTERCLASS_PROJECT } from "@/lib/distribution-constants";

export default function HomePage() {
  const projects = useQuery(api.dashboard.listProjects);
  const masterclassProject = useQuery(api.distribution.getMasterclassProject);
  const createProject = useMutation(api.projects.createProject);
  const seedMasterclass = useMutation(api.distribution.seedMasterclassProject);
  const [isCreatingVideoProject, setIsCreatingVideoProject] = useState(false);
  const [isSeedingMasterclass, setIsSeedingMasterclass] = useState(false);

  const hasVideoProject = useMemo(
    () => (projects ?? []).some((project: any) => String(project.name ?? "").toLowerCase().includes("video")),
    [projects],
  );

  const hasMasterclass = !!masterclassProject;

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

  async function handleSeedMasterclass() {
    if (hasMasterclass) return;
    setIsSeedingMasterclass(true);
    try {
      await seedMasterclass({});
    } finally {
      setIsSeedingMasterclass(false);
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
          <p className="muted">Production oversight for agent marketing: content review, calendar, and distribution metadata.</p>
        </div>
        <div className="header-actions-stack">
          {!hasMasterclass ? (
            <button type="button" className="primary-button" onClick={handleSeedMasterclass} disabled={isSeedingMasterclass}>
              {isSeedingMasterclass ? "Creating…" : `Add ${MASTERCLASS_PROJECT.name}`}
            </button>
          ) : null}
          {!hasVideoProject ? (
            <button type="button" className="secondary-button" onClick={handleCreateVideoProject} disabled={isCreatingVideoProject}>
              {isCreatingVideoProject ? "Creating video project…" : "Add video workflow"}
            </button>
          ) : null}
        </div>
      </div>
      {hasMasterclass ? (
        <p className="muted">
          Masterclass project ready. Open it to add content, or use the{" "}
          <a href="/calendar" className="text-link">
            calendar
          </a>{" "}
          to plan week-one distribution.
        </p>
      ) : null}
      {projects.length ? (
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      ) : (
        <EmptyState title="No projects yet" body="Create the masterclass project or seed projects in Convex to start." />
      )}
    </section>
  );
}
