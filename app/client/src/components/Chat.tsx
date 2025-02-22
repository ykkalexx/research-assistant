import { useEffect, useState } from "react";
import api from "../config/api";
import { useWebSocket } from "../config/websocket";
import MyBtn from "./MyBtn";

interface Message {
  id: string;
  content: string;
  isAi: boolean;
}

interface ChatProps {
  documentId: number;
}

type CitationStyle = "APA" | "MLA" | "Chicago";

export const Chat = ({ documentId }: ChatProps) => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { lastUpload } = useWebSocket();
  const [showCitationDropdown, setShowCitationDropdown] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: question,
      isAi: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await api.post("/question", {
        documentId,
        question: userMessage.content,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.data.answer,
        isAi: true,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Error:", err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I couldn't process your request. Please try again.",
        isAi: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // typescript ...
  useEffect(() => {
    if (
      lastUpload &&
      typeof lastUpload === "object" &&
      "id" in lastUpload &&
      typeof lastUpload.id === "number" &&
      lastUpload.id === documentId
    ) {
      setMessages([]);
    }
  }, [lastUpload, documentId]);

  const handleRefs = async () => {
    try {
      setLoading(true);
      const response = await api.post("/refs", { id: documentId });

      // Create AI message for references
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: Array.isArray(response.data.refs)
          ? "Here are the references:\n\n" + response.data.refs.join("\n")
          : "No references found for this document.",
        isAi: true,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to get references:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry, I couldn't fetch the references. Please try again.",
        isAi: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSummary = async () => {
    try {
      setLoading(true);
      const response = await api.post("/summary", { id: documentId });

      // Create AI message for summary
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: response.data.summary
          ? "Here's the summary:\n\n" + response.data.summary
          : "No summary found for this document.",
        isAi: true,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to get summary:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry, I couldn't fetch the summary. Please try again.",
        isAi: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCitation = async (style: CitationStyle) => {
    try {
      setLoading(true);
      setShowCitationDropdown(false);
      const response = await api.post("/citation", { id: documentId, style });

      // Create AI message for summary
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: response.data.citation
          ? "Here's the citation:\n\n" + response.data.citation
          : "No summary found for this document.",
        isAi: true,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to get summary:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry, I couldn't fetch the summary. Please try again.",
        isAi: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-300px)]">
      {/* Messages Container */}
      <div className="flex-1 p-2 mb-4 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isAi ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg break-words whitespace-pre-wrap ${
                message.isAi
                  ? "bg-[#444654] text-[#ECECF1]"
                  : "bg-[#343541] text-[#ECECF1]"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-[#444654]">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-[#8E8EA0] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[#8E8EA0] rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-[#8E8EA0] rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Container */}
      <div className="flex flex-col gap-5 mt-auto">
        <div className="relative items-center p-2 bg-[#303030] rounded-xl shadow-lg border border-[#2A2B32]">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
            className="w-full p-4 pr-10 bg-transparent text-[#ECECF1] placeholder-[#8E8EA0] outline-none resize-none font-light text-sm"
            placeholder="Ask a question..."
            style={{
              caretColor: "#ECECF1",
            }}
          />
          <button
            className="absolute right-4 bottom-4 p-1 rounded-lg hover:bg-[#2A2B32] transition-colors duration-200"
            disabled={!question.trim() || loading}
            onClick={handleSubmit}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className={`${
                question.trim() && !loading
                  ? "text-[#ECECF1]"
                  : "text-[#8E8EA0]"
              } transition-colors duration-200`}
            >
              <path
                d="M7 11L12 6L17 11M12 18V7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-10">
          <MyBtn
            onClick={handleRefs}
            disabled={loading}
            className="w-full text-sm sm:w-auto sm:text-base"
          >
            Get References
          </MyBtn>
          <MyBtn
            onClick={handleSummary}
            disabled={loading}
            className="w-full text-sm sm:w-auto sm:text-base"
          >
            Get Summary
          </MyBtn>
          <div className="relative w-full group sm:w-auto">
            <MyBtn
              onClick={() => setShowCitationDropdown(!showCitationDropdown)}
              disabled={loading}
              className="w-full text-sm sm:w-auto sm:text-base"
            >
              Get Citation
            </MyBtn>
            {showCitationDropdown && (
              <div className="absolute bottom-full left-0 sm:left-1/2 mb-2 py-2 w-full sm:w-32 bg-[#303030] rounded-lg shadow-xl border border-[#2A2B32] z-10 sm:transform sm:-translate-x-1/2">
                {(["APA", "MLA", "Chicago"] as CitationStyle[]).map((style) => (
                  <button
                    key={style}
                    onClick={() => handleCitation(style)}
                    className="w-full px-4 py-3 sm:py-2 text-center sm:text-left text-sm sm:text-base text-[#ECECF1] hover:bg-[#2A2B32] transition-colors active:bg-[#2A2B32]"
                  >
                    {style}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
