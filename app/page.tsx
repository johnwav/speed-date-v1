"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Room = {
  _id: string;
  status: string;
};

export default function Home() {
  const [room, setRoom] = useState<Room | undefined>();
  const fetchRooms = async () => {
    const response = await fetch("/api/rooms");
    const rooms = await response.json();
    // debugger;
    if (rooms.length > 0) {
      // TODO: connect to the room
      setRoom(rooms[0]);
    } else {
      // create a new room
      const response = await fetch("/api/rooms", {
        method: "POST",
      });
      const room = await response.json();
      setRoom(room);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return <main className={styles.main}>{room?._id}</main>;
}
