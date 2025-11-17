import { createContext, useContext } from "react";

export const MessagingContext = createContext({
  messages: [],
  threads: [],
  addMessage: () => {},
  sendMessage: () => {},
  markThreadRead: () => {},
  templates: [],
  alerts: [],
  connectionStatus: "offline",
  currentUser: null
});

export const useMessaging = () => useContext(MessagingContext);
