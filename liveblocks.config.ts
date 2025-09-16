import { createClient, LiveMap } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
  // Optional: You can add other configuration here
});

// Presence represents the properties that exist on every user in the Room
// and that will automatically be kept in sync. Accessible through the
// `user.presence` property. Must be JSON-serializable.
export type Presence = {
  // cursor represents the user's cursor position
  cursor: { x: number; y: number } | null;
  // username represents the user's name
  username: string | null;
  // selection represents the user's text selection in the editor
  selection: {
    anchor: number;
    head: number;
  } | null;
};

// Optionally, Storage represents the shared document that persists in the
// Room, even after all users leave. Fields under Storage typically are
// LiveList, LiveMap, LiveObject instances, for which updates are
// automatically persisted and synced to all connected clients.
export type Storage = {
  // We're using a LiveMap to store our collaborative text document
  code: LiveMap<string, any>;
};

// Optionally, UserMeta represents static/readonly metadata on each user, as
// provided by your own custom auth back end (if used). Useful for data that
// will not change during a session, like a user's name or avatar.
export type UserMeta = {
  id: string;
  info: {
    name: string;
    avatar: string;
    color: string;
  };
};

// Optionally, the type of custom events broadcast and listened to in this
// room. Use a union for multiple events. Must be JSON-serializable.
export type RoomEvent = {
  type: "CODE_CHANGE";
  data: {
    userId: string;
    timestamp: number;
    change: string;
  };
};

// Optionally, when using Comments, ThreadMetadata represents metadata on
// each thread. Can only be set when creating the thread.
export type ThreadMetadata = {
  // Example, attaching coordinates to a thread
  x: number;
  y: number;
};

export const {
  suspense: {
    RoomProvider,
    useRoom,
    useMyPresence,
    useUpdateMyPresence,
    useOthers,
    useOthersMapped,
    useOthersConnectionIds,
    useOther,
    useBroadcastEvent,
    useEventListener,
    useErrorListener,
    useStorage,
    useHistory,
    useUndo,
    useRedo,
    useCanUndo,
    useCanRedo,
    useMutation,
    useStatus,
    useLostConnectionListener,
    useThreads,
    useUser,
    useCreateThread,
    useEditThreadMetadata,
    useCreateComment,
    useEditComment,
    useDeleteComment,
    useAddReaction,
    useRemoveReaction,
  },
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent, ThreadMetadata>(
  client
);

export { client };