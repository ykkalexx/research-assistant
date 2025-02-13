import { useState } from "react";
import api from "../config/api";

interface Message {
  id: string;
  content: string;
  isAi: boolean;
}

export const Chat = () => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

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
        documentId: 1,
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-2 mb-4 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isAi ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
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
              question.trim() && !loading ? "text-[#ECECF1]" : "text-[#8E8EA0]"
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
    </div>
  );
};
