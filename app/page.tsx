"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function normalizeRoomId(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export default function HomePage() {
  const router = useRouter();
  const [roomIdInput, setRoomIdInput] = useState("");

  const normalizedRoomId = useMemo(() => normalizeRoomId(roomIdInput), [roomIdInput]);

  const createRoom = () => {
    const roomId = normalizedRoomId || crypto.randomUUID();
    router.push(`/room/${roomId}?mode=create`);
  };

  const joinRoom = () => {
    if (!normalizedRoomId) {
      return;
    }

    router.push(`/room/${normalizedRoomId}?mode=join`);
  };

  return (
    <main>
      <div style={{ width: "100vw", marginInline: "calc(50% - 50vw)" }}>
        <img
          src="/images/blossom-hero.png"
          alt="Plant Biomes hero"
          style={{ display: "block", width: "100%", height: "auto" }}
        />
      </div>

      <div style={{ display: "grid", gap: 12, maxWidth: 420, margin: "48px auto" }}>
        <h1>Plant Biomes</h1>
        <label htmlFor="room-id">Room ID</label>
        <input
          id="room-id"
          placeholder="enter-room-id"
          value={roomIdInput}
          onChange={(event) => setRoomIdInput(event.target.value)}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={createRoom}>
            Create Room
          </button>
          <button type="button" onClick={joinRoom} disabled={!normalizedRoomId}>
            Join Room
          </button>
        </div>
      </div>
    </main>
  );
}
