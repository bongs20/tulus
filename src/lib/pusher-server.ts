import Pusher from "pusher";

let pusherServer: Pusher | null = null;

function getPusherServer() {
  if (pusherServer) {
    return pusherServer;
  }

  pusherServer = new Pusher({
    appId: process.env.PUSHER_APP_ID || "",
    key: process.env.PUSHER_KEY || "",
    secret: process.env.PUSHER_SECRET || "",
    cluster: process.env.PUSHER_CLUSTER || "ap1",
    useTLS: true,
  });

  return pusherServer;
}

export function isPusherServerConfigured() {
  return Boolean(
    process.env.PUSHER_APP_ID &&
      process.env.PUSHER_KEY &&
      process.env.PUSHER_SECRET &&
      process.env.PUSHER_CLUSTER,
  );
}

export async function triggerPusherEvent(
  channel: string,
  event: string,
  payload: Record<string, unknown>,
) {
  if (!isPusherServerConfigured()) {
    return;
  }

  await getPusherServer().trigger(channel, event, payload);
}
