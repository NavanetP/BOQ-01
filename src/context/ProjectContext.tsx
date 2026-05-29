import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { ProjectInfo } from "../utils/boqPdf";

type ProjectContextType = {
  projectInfo: ProjectInfo;
  setProjectInfo: React.Dispatch<React.SetStateAction<ProjectInfo>>;
};

const STORAGE_KEY = "boq_project";

function defaultProjectInfo(): ProjectInfo {
  return {
    name: "",
    client: "",
    date: new Date().toISOString().slice(0, 10),
    engineer: "",
    notes: "",
    currency: "USD",
    fxRate: 1,
    taxRate: 18,
    taxLabel: "GST",
  };
}

function loadProjectInfo(): ProjectInfo {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultProjectInfo(), ...JSON.parse(saved) };
  } catch {
    /* ignore */
  }
  return defaultProjectInfo();
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>(loadProjectInfo);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projectInfo));
  }, [projectInfo]);

  return (
    <ProjectContext.Provider value={{ projectInfo, setProjectInfo }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
