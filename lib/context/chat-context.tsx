"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
  JSX,
} from "react";

interface ChatContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleChat: () => void;
  unreadCount: number;
  setUnreadCount: (n: number | ((prev: number) => number)) => void;
  clearUnread: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({children}: {children: ReactNode}): JSX.Element {
  const [isOpen, setIsOpenState] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isOpenRef = useRef(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const clearUnread = useCallback(() => setUnreadCount(0), []);

  const setIsOpen = useCallback((open: boolean) => {
    setIsOpenState(open);
    if (open) setUnreadCount(0);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen(!isOpenRef.current);
  }, [setIsOpen]);

  return (
    <ChatContext.Provider
      value={{isOpen, setIsOpen, toggleChat, unreadCount, setUnreadCount, clearUnread}}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
}
