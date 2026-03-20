import { EXAMPLE_QUERIES } from "@/utils/constants";

interface OutputPanelProps {
  content: string | null;
  onChipClick: (text: string) => void;
}

const OutputPanel = ({ content, onChipClick }: OutputPanelProps) => (
  <div className="h-full flex flex-col overflow-y-auto" style={{ padding: 24 }}>
    {content ? (
      <p style={{ color: "#FFFFFF", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{content}</p>
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center">
        <p style={{ color: "#8892A4", fontSize: 14, marginBottom: 24 }}>Ask a question to see results</p>
        <div className="flex flex-col gap-2">
          {EXAMPLE_QUERIES.slice(0, 3).map((q) => (
            <button
              key={q}
              onClick={() => onChipClick(q)}
              className="text-left transition-colors duration-150"
              style={{
                border: "1px solid rgba(240,165,0,0.3)",
                background: "rgba(240,165,0,0.05)",
                borderRadius: 20,
                padding: "8px 16px",
                fontSize: 13,
                color: "#F0A500",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(240,165,0,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(240,165,0,0.05)")}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default OutputPanel;
