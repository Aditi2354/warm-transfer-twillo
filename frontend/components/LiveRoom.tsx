'use client';

import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  TrackLoop,
  ParticipantTile,
  useTracks,
  useConnectionState,   // ✅ yeh hook state deta hai
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

type Props = { token: string; serverUrl: string };

export default function LiveRoom({ token, serverUrl }: Props) {
  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect
      video
      audio
      className="h-[70vh] rounded-2xl overflow-hidden flex flex-col gap-4 p-3 bg-neutral-900/40"
    >
      <RoomUI />
    </LiveKitRoom>
  );
}

function RoomUI() {
  const connectionState = useConnectionState();  // ✅ 'connecting' | 'connected' | etc.

  if (connectionState !== 'connected') {
    return <div className="h-full grid place-items-center text-neutral-300">Connecting to LiveKit…</div>;
  }

  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);

  return (
    <>
      <RoomAudioRenderer />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 grow overflow-auto">
        <TrackLoop tracks={tracks}>
          <ParticipantTile className="rounded-xl overflow-hidden shadow" />
        </TrackLoop>
      </div>
      <ControlBar className="mt-2" />
    </>
  );
}
