interface OutputPanelProps {
  content: string | null;
  onChipClick: (text: string) => void;
}

const exampleChips = [
  "What was Apple's gross margin Q4 2023?",
  "Should I hold Nvidia?",
  "What's Tesla trading at?",
];

const OutputPanel = ({ content, onChipClick }: OutputPanelProps) => (
  <div className="h-full flex flex-col overflow-hidden">
    {content ? (
      <div className="flex-1 overflow-y-auto p-5">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
        <p className="text-sm text-muted-foreground text-center">
          Ask a question to see results
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {exampleChips.map((chip) => (
            <button
              key={chip}
              onClick={() => onChipClick(chip)}
              className="text-xs px-4 py-2 rounded-full transition-colors hover:bg-primary/10"
              style={{
                border: "1px solid rgba(240,165,0,0.3)",
                background: "rgba(240,165,0,0.05)",
                color: "#F0A500",
                fontSize: 13,
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default OutputPanel;
