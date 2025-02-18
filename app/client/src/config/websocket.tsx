import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import io from "socket.io-client";

interface UploadData {
  id: number;
  summary: string;
  references: string[];
}

interface WebSocketContextType {
  lastUpload: UploadData | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  lastUpload: null,
});

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [lastUpload, setLastUpload] = useState<UploadData | null>(null);

  useEffect(() => {
    const socket = io("http://localhost:3000", {
      withCredentials: true,
    });

    console.log("WebSocket connected");

    socket.on("upload_complete", (data: UploadData) => {
      console.log("Document uploaded:", data);
      setLastUpload(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ lastUpload }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
