import { UploadModal } from "./components/UploadModal";

function App() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <h1 className="text-3xl p-6 font-semibold">Research Assistant</h1>
      <UploadModal />
    </div>
  );
}

export default App;
