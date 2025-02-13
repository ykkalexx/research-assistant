import { useEffect } from "react";
import { Chat } from "./components/Chat";
import { UploadModal } from "./components/UploadModal";
import api from "./config/api";

function App() {
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

  return (
    <div className="flex flex-col h-screen bg-[#212121]">
      <nav className="w-full px-6 py-4 flex-none bg-[#171717]">
        <h1 className="text-2xl font-semibold text-[#d1d1d1]">
          Research Assistant
        </h1>
      </nav>

      <main className="container flex flex-col flex-1 px-4 py-8 mx-auto overflow-hidden">
        <div className="w-full max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <p className="text-[#d1d1d1] mb-6">
              Upload research papers and get AI-powered summaries, insights, and
              answers to your questions
            </p>
            <UploadModal />
          </div>
        </div>

        <div className="flex flex-col flex-1 h-full mt-auto">
          <div className="w-full max-w-4xl p-6 mx-auto rounded-t-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Ask Questions about your Research Paper
              </h2>
            </div>
            <div className="h-[400px] overflow-y-auto">
              <Chat />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
export default App;
