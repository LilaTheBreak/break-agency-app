import { createContext, useContext } from "react";

export const MessagingContext = createContext({
  messages: [],
  addMessage: () => {}
});

export const useMessaging = () => useContext(MessagingContext);
