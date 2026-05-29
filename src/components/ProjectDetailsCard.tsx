import { useProject } from "../context/ProjectContext";

const FIELDS = [
  ["name", "Project Name", "Acme DC Expansion"],
  ["client", "Client / Organization", ""],
  ["engineer", "Presales Engineer", ""],
  ["date", "Quote Date", ""],
] as const;

export default function ProjectDetailsCard() {
  const { projectInfo, setProjectInfo } = useProject();

  return (
    <div className="boq-form-card boq-project-details">
      <div className="boq-form-card-header">
        <h2>Project Details</h2>
        <p>Metadata included on your BOQ document</p>
      </div>
      <div className="boq-form-body">
        {FIELDS.map(([field, label, placeholder]) => (
          <div key={field} className="boq-form-field">
            <label className="boq-label" htmlFor={`home-proj-${field}`}>
              {label}
            </label>
            <input
              id={`home-proj-${field}`}
              type={field === "date" ? "date" : "text"}
              className={`boq-input${field === "date" ? "" : " boq-input-mono"}`}
              placeholder={placeholder}
              value={projectInfo[field]}
              onChange={(e) =>
                setProjectInfo((p) => ({ ...p, [field]: e.target.value }))
              }
            />
          </div>
        ))}
        <div className="boq-form-field">
          <label className="boq-label" htmlFor="home-proj-notes">
            Notes
          </label>
          <textarea
            id="home-proj-notes"
            className="boq-textarea"
            rows={3}
            placeholder="Scope, assumptions, special requirements..."
            value={projectInfo.notes}
            onChange={(e) =>
              setProjectInfo((p) => ({ ...p, notes: e.target.value }))
            }
          />
        </div>
      </div>
    </div>
  );
}
