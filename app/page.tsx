"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Room = {
  _id: string;
  status: string;
};

type Tmessage = {
  userId: string;
  message: string;
};

async function connectToAgora(roomId: string, userId: string) {
  const { default: AgoraRTM } = await import("agora-rtm-sdk");
  const client = AgoraRTM.createInstance(process.env.NEXT_PUBLIC_AGORA_APP_ID!);
  await client.login({
    uid: userId,
  });
  const channel = await client.createChannel(roomId);
  await channel.join();
  channel.on("ChannelMessage", (message, peerId) => {
    console.log(message, peerId);
  });
}

async function getRandomRoom(): Promise<Room[]> {
  const response = await fetch("/api/rooms");
  const rooms = await response.json();
  return rooms;
}

async function createRoom(): Promise<Room> {
  const response = await fetch("/api/rooms", {
    method: "POST",
  });
  const room = await response.json();
  return room;
}

export default function Home() {
  const [room, setRoom] = useState<Room | undefined>();
  const [userId, setuserId] = useState(Math.random() * 1e6 + "");
  const [message, setmessage] = useState([]);

  async function fetchRooms() {
    getRandomRoom().then((rooms) => {
      if (rooms.length > 0) {
        setRoom(rooms[0]);
        connectToAgora(rooms[0]._id, userId);
      } else {
        createRoom().then((room) => {
          setRoom(room);
          connectToAgora(room?._id, userId);
        });
      }
    });
  }

  function handleStartChat() {
    fetchRooms();
  }

  useEffect(() => {}, []);

  return (
    <main className={styles.main}>
      <button onClick={handleStartChat}>Chat</button>
      {room?._id}
    </main>
  );
}
