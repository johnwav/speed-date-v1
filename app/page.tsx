"use client";
import { useRef, useState } from "react";
import styles from "./page.module.css";
import { RtmChannel } from "agora-rtm-sdk";
import { ICameraVideoTrack, IRemoteVideoTrack } from "agora-rtc-sdk-ng";
import { VideoPlayer } from "./components/VideoPlayer";

type Room = {
  _id: string;
  status: string;
};

type Tmessage = {
  userId: string;
  message: string | undefined;
};

async function connectToAgoraRTC(
  userId: string,
  roomId: string,
  onVideoConnect: any,
  onWebcamStart: any
) {
  const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");
  const client = AgoraRTC.createClient({
    mode: "rtc",
    codec: "vp8",
  });

  await client.join(
    process.env.NEXT_PUBLIC_AGORA_APP_ID!,
    roomId,
    "68c79cc200a9448490ef2721756e89c2",
    userId
  );

  client.on("user-published", (themUser, mediaType) => {
    client.subscribe(themUser, mediaType).then(() => {
      if (mediaType === "video") {
        onVideoConnect(themUser);
      }
    });
  });

  const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
  onWebcamStart(tracks[1]);
  await client.publish(tracks);

  return { tracks, client };
}

async function connectToAgoraRTM(
  roomId: string,
  userId: string,
  onMessage: (message: Tmessage) => void
) {
  const { default: AgoraRTM } = await import("agora-rtm-sdk");
  const client = AgoraRTM.createInstance(process.env.NEXT_PUBLIC_AGORA_APP_ID!);
  await client.login({
    uid: userId,
  });
  const channel = await client.createChannel(roomId);
  await channel.join();
  channel.on("ChannelMessage", (message, userId) => {
    onMessage({
      userId,
      message: message.text,
    });
  });

  return {
    channel,
  };
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
  const [userId] = useState(() => parseInt(`${Math.random() * 1e6}`) + "");
  const [messages, setMessages] = useState<Tmessage[]>([]);
  const [input, setInput] = useState("");
  const [themVideo, setThemVideo] = useState<IRemoteVideoTrack>();
  const [myVideo, setMyVideo] = useState<ICameraVideoTrack>();

  const channelRef = useRef<RtmChannel>();
  const isChatting = room!!;

  async function handleSendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!input) return;
    await channelRef.current?.sendMessage({
      text: input,
    });
    setMessages((cur) => [
      ...cur,
      {
        userId,
        message: input,
      },
    ]);
    setInput("");
  }

  async function fetchRooms() {
    const rooms = await getRandomRoom();
    if (rooms && rooms.length > 0) {
      setRoom(rooms[0]);
      const { channel } = await connectToAgoraRTM(
        rooms[0]?._id,
        userId,
        (message: Tmessage) => setMessages((curr) => [...curr, message])
      );
      await connectToAgoraRTC(
        rooms[0]._id,
        userId,
        (themVideo: IRemoteVideoTrack) => setThemVideo(themVideo),
        (myVideo: ICameraVideoTrack) => setMyVideo(myVideo)
      );
      channelRef.current = channel;
    } else {
      const room = await createRoom();
      setRoom(room);
      const { channel } = await connectToAgoraRTM(
        room._id,
        userId,
        (message: Tmessage) => setMessages((curr) => [...curr, message])
      );
      await connectToAgoraRTC(
        room._id,
        userId,
        (themVideo: IRemoteVideoTrack) => setThemVideo(themVideo),
        (myVideo: ICameraVideoTrack) => setMyVideo(myVideo)
      );
      channelRef.current = channel;
    }
  }

  function handleStartChat() {
    fetchRooms();
  }

  function convertID(message: Tmessage) {
    return message.userId === userId ? "You" : "Them";
  }

  return (
    <main className={styles.main}>
      {isChatting ? (
        <div className="chat-window">
          <div className="video-panel">
            <div className="video-stream">
              {myVideo && (
                <VideoPlayer
                  style={{ width: "300px", height: "300px" }}
                  videoTrack={myVideo}
                />
              )}
            </div>
            <div className="video-stream">
              {themVideo && (
                <VideoPlayer
                  style={{ width: "300px", height: "300px" }}
                  videoTrack={themVideo}
                />
              )}
            </div>
          </div>
          <div className="chat-panel">
            {room?._id}
            <ul>
              {messages.map((message, index) => (
                <li key={index}>
                  {convertID(message)} {message?.message}
                </li>
              ))}
            </ul>
            <form onSubmit={handleSendMessage}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                type="text"
              />
              <button type="submit">send</button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <button onClick={handleStartChat}>Chat</button>
        </>
      )}
    </main>
  );
}
