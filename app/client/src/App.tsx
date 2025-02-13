import { Chat } from "./components/Chat";
import { UploadModal } from "./components/UploadModal";

function App() {
  return (
    <div className="flex flex-col h-screen bg-[#212121]">
      {/* Navigation Bar */}
      <nav className="w-full px-6 py-4 flex-none bg-[#171717]">
        <h1 className="text-2xl font-semibold text-[#d1d1d1]">
          Research Assistant
        </h1>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 overflow-hidden flex flex-col">
        <div className="max-w-4xl mx-auto w-full">
          {/* Feature Description */}
          <div className="text-center mb-8">
            <p className="text-[#d1d1d1] mb-6">
              Upload research papers and get AI-powered summaries, insights, and
              answers to your questions
            </p>
            <UploadModal />
          </div>
        </div>

        {/* Chat Interface - Fixed at bottom */}
        <div className="flex-1 flex flex-col mt-auto">
          <div className="rounded-t-lg p-6 max-w-4xl mx-auto w-full">
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
