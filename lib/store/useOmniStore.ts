import { create } from "zustand";
import { NeutralMessage } from "../context/types";

export interface ColumnStreamState {
  text: string;
  isStreaming: boolean;
  error?: string;
  latencyMs?: number;
  tokens?: {
    prompt: number;
    completion: number;
  };
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface OmniStore {
  // App mode
  mode: "chat" | "split";
  setMode: (mode: "chat" | "split") => void;

  // Active single-chat model
  activeModel: string;
  setActiveModel: (model: string) => void;

  // Split-view comparison models (2 to 4)
  splitModels: string[];
  setSplitModels: (models: string[]) => void;
  addSplitModel: (model: string) => void;
  removeSplitModel: (model: string) => void;

  // Conversation state
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  messages: NeutralMessage[];
  isLoadingConversation: boolean;

  setConversations: (convs: ConversationSummary[]) => void;
  setActiveConversationId: (id: string | null) => void;
  setMessages: (messages: NeutralMessage[]) => void;
  addMessage: (message: NeutralMessage) => void;
  updateMessageContent: (index: number, content: string) => void;
  updateMessage: (index: number, update: Partial<NeutralMessage>) => void;
  setIsLoadingConversation: (loading: boolean) => void;

  // Single chat streaming state
  isStreaming: boolean;
  setIsStreaming: (status: boolean) => void;

  // Split view streaming state per model
  columnStreams: Record<string, ColumnStreamState>;
  setColumnStream: (modelId: string, update: Partial<ColumnStreamState>) => void;
  resetColumnStreams: () => void;
}

export const useOmniStore = create<OmniStore>((set) => ({
  mode: "chat",
  setMode: (mode) => set({ mode }),

  activeModel: "gpt-4o",
  setActiveModel: (activeModel) => set({ activeModel }),

  splitModels: ["gpt-4o", "claude-3-5-sonnet"],
  setSplitModels: (splitModels) => set({ splitModels: splitModels.slice(0, 4) }),
  addSplitModel: (model) =>
    set((state) => {
      if (state.splitModels.includes(model) || state.splitModels.length >= 4) {
        return state;
      }
      return { splitModels: [...state.splitModels, model] };
    }),
  removeSplitModel: (model) =>
    set((state) => {
      if (state.splitModels.length <= 1) return state;
      return { splitModels: state.splitModels.filter((m) => m !== model) };
    }),

  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoadingConversation: false,

  setConversations: (conversations) => set({ conversations }),
  setActiveConversationId: (activeConversationId) => set({ activeConversationId }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateMessageContent: (index, content) =>
    set((state) => {
      const updated = [...state.messages];
      if (updated[index]) {
        updated[index] = { ...updated[index], content };
      }
      return { messages: updated };
    }),
  updateMessage: (index, update) =>
    set((state) => {
      const updated = [...state.messages];
      if (updated[index]) {
        updated[index] = { ...updated[index], ...update };
      }
      return { messages: updated };
    }),
  setIsLoadingConversation: (isLoadingConversation) => set({ isLoadingConversation }),

  isStreaming: false,
  setIsStreaming: (isStreaming) => set({ isStreaming }),

  columnStreams: {},
  setColumnStream: (modelId, update) =>
    set((state) => ({
      columnStreams: {
        ...state.columnStreams,
        [modelId]: {
          ...(state.columnStreams[modelId] || { text: "", isStreaming: false }),
          ...update,
        },
      },
    })),
  resetColumnStreams: () => set({ columnStreams: {} }),
}));

