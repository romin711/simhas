import { useMemo, useState } from "react";
import Chat from "./components/Chat";
import SourcePanel from "./components/SourcePanel";
import Upload from "./components/Upload";

export default function App() {
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const workspaceMeta = useMemo(() => {
    if (!selectedAnswer) return "No answer selected";
    const sourceCount = Array.isArray(selectedAnswer.sources) ? selectedAnswer.sources.length : 0;
    return `Selected answer • ${sourceCount} source${sourceCount === 1 ? "" : "s"}`;
  }, [selectedAnswer]);

  return (
    <main className="workspace-root">
      <header className="workspace-head">
        <div className="workspace-kicker">Local source-aware workspace</div>
        <h1 className="workspace-title">Simhas</h1>
        <p className="workspace-subtitle">
          A quiet workspace for document-grounded reasoning. Upload PDFs, ask focused questions, and verify each answer through source evidence.
        </p>
      </header>

      <section className="workspace-grid" aria-label="Simhas workspace">
        <aside className="panel left-panel" aria-label="Document management panel">
          <Upload />
        </aside>

        <section className="panel center-panel" aria-label="Query and answer workspace">
          <Chat onSelectAnswer={setSelectedAnswer} />
        </section>

        <aside className="panel right-panel" aria-label="Source verification panel">
          <p className="workspace-kicker" style={{ marginBottom: 8 }}>
            {workspaceMeta}
          </p>
          <SourcePanel selectedAnswer={selectedAnswer} />
        </aside>
      </section>
    </main>
  );
}