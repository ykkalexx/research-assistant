import { useEffect, useState } from "react";
import { Chat } from "./components/Chat";
import { UploadModal } from "./components/UploadModal";
import api from "./config/api";
import { Sidebar } from "./components/Sidebar";

function App() {
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      try {
        await api.get("/init-session");
      } catch (error) {
        console.error("Failed to initialize session:", error);
      }
    };

    initSession();
  }, []);

  const handleDocumentSelect = (docId: number) => {
    setSelectedDocId(docId);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#212121]">
      <nav className="w-full px-4 py-3 md:px-6 md:py-4 flex-none bg-[#171717] flex items-center justify-between">
        <button
          className="p-2 text-[#d1d1d1] md:hidden"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                isSidebarOpen
                  ? "M6 18L18 6M6 6l12 12"
                  : "M4 6h16M4 12h16M4 18h16"
              }
            />
          </svg>
        </button>
        <h1 className="text-xl md:text-2xl font-semibold text-[#d1d1d1]">
          Research Assistant
        </h1>
        <div className="w-8 md:hidden" />
      </nav>

      <div className="relative flex flex-1 overflow-hidden">
        <div
          className={`${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 absolute md:relative z-30 h-full transition-transform duration-300 ease-in-out md:transition-none`}
        >
          <Sidebar
            onDocumentSelect={handleDocumentSelect}
            selectedDocId={selectedDocId}
          />
        </div>

        {isSidebarOpen && (
          <div
            className="absolute inset-0 z-20 bg-black bg-opacity-50 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="container flex flex-col flex-1 px-4 py-4 mx-auto overflow-hidden md:py-8">
          <div className="w-full max-w-4xl mx-auto">
            <div className="mb-4 text-center md:mb-8">
              <p className="text-[#d1d1d1] mb-4 md:mb-6 text-sm md:text-base">
                Upload research papers and get AI-powered summaries, insights,
                and answers to your questions
              </p>
              <UploadModal
                onUploadSuccess={(docId) => setSelectedDocId(docId)}
              />
            </div>
          </div>

          <div className="flex flex-col flex-1 h-full mt-auto">
            <div className="w-full h-full max-w-4xl p-3 mx-auto rounded-t-lg md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white md:text-xl">
                  Ask Questions about your Research Paper
                </h2>
              </div>
              <div className="h-full overflow-y-auto">
                {selectedDocId ? (
                  <Chat documentId={selectedDocId} />
                ) : (
                  <div className="flex items-center justify-center h-full text-[#8E8EA0] text-sm md:text-base">
                    Upload a document to start asking questions
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
