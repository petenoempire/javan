import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { getLiveKitToken, LIVEKIT_URL } from "@/lib/livekit";

export function useLiveKitRoom({
  streamId,
  userId,
  isHost,
  videoEl,
}: {
  streamId: string | undefined;
  userId: string | undefined;
  isHost: boolean;
  videoEl: React.RefObject<HTMLVideoElement | null>;
}) {
  const roomRef = useRef<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    if (!streamId || !userId) return;
    if (!LIVEKIT_URL) {
      setConnectError("LiveKit isn't configured (missing VITE_LIVEKIT_URL).");
      return;
    }

    let cancelled = false;
    const room = new Room();
    roomRef.current = room;

    const attachTrack = (track: Track) => {
      if (track.kind === Track.Kind.Video) {
        if (videoEl.current) track.attach(videoEl.current);
      } else if (track.kind === Track.Kind.Audio) {
        const audioEl = track.attach();
        audioEl.autoplay = true;
        document.body.appendChild(audioEl);
      }
    };

    room.on(RoomEvent.TrackSubscribed, (track) => attachTrack(track));
    room.on(RoomEvent.Disconnected, () => setConnected(false));

    (async () => {
      try {
        const token = await getLiveKitToken(streamId, userId, isHost);
        if (cancelled) return;
        await room.connect(LIVEKIT_URL, token);
        if (cancelled) return;

        if (isHost) {
          await room.localParticipant.setCameraEnabled(true);
          await room.localParticipant.setMicrophoneEnabled(true);
          room.localParticipant.videoTrackPublications.forEach((pub) => {
            if (pub.track) attachTrack(pub.track);
          });
        } else {
          room.remoteParticipants.forEach((participant) => {
            participant.trackPublications.forEach((pub) => {
              if (pub.track) attachTrack(pub.track);
            });
          });
        }
        setConnected(true);
      } catch (err: any) {
        if (!cancelled) setConnectError(err?.message ?? "Couldn't connect to the stream");
      }
    })();

    return () => {
      cancelled = true;
      room.disconnect();
      roomRef.current = null;
    };
  }, [streamId, userId, isHost, videoEl]);

  return { connected, connectError };
}
