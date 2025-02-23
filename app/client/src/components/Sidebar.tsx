import { useState, useEffect } from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import api from "../config/api";
import { useWebSocket } from "../config/websocket";

interface Document {
  id: number;
  original_name: string;
  summary: string;
  refs: string[];
  created_at: string;
}

interface SidebarProps {
  onDocumentSelect: (docId: number) => void;
  selectedDocId: number | null;
}

export const Sidebar = ({ onDocumentSelect, selectedDocId }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const { lastUpload } = useWebSocket();

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/documents");
      setDocuments(response.data.documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  useEffect(() => {
    if (lastUpload) {
      console.log("New document uploaded, refreshing list...");
      fetchDocs();
    }
  }, [lastUpload]);

  return (
    <aside
      className={`relative bg-[#171717] h-full transition-all duration-300 ease-in-out ${
        isOpen ? "w-[250px]" : "w-[60px]"
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:block absolute -right-4 top-6 bg-[#171717] rounded-full p-1 cursor-pointer hover:bg-[#212121] transition-colors z-50"
      >
        {isOpen ? (
          <IconChevronLeft size={20} className="text-[#d1d1d1]" />
        ) : (
          <IconChevronRight size={20} className="text-[#d1d1d1]" />
        )}
      </button>

      <div className={`p-4 ${!isOpen && "opacity-0 hidden"}`}>
        <div className="space-y-2">
          {loading ? (
            <div className="text-[#8e8e8e] text-sm">Loading...</div>
          ) : documents.length > 0 ? (
            documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onDocumentSelect(doc.id)}
                className={`p-2 rounded cursor-pointer transition-colors ${
                  selectedDocId === doc.id
                    ? "bg-[#2A2B32] text-white"
                    : "hover:bg-[#212121]"
                }`}
              >
                <h3 className="text-[#d1d1d1] text-sm font-medium truncate">
                  {doc.original_name}
                </h3>
                <p className="text-[#8e8e8e] text-xs">
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <div className="text-[#8e8e8e] text-sm">No documents found</div>
          )}
        </div>
      </div>
    </aside>
  );
};
