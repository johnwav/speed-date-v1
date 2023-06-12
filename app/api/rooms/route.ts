// import { NextResponse } from "next/server";
import dbConnect from "@/utils/database";
import Room from "@/models/Rooms";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const rooms = await Room.aggregate([
      { $match: { status: "waiting" } },
      { $sample: { size: 1 } },
    ]);
    if (rooms.length > 0) {
      const roomId = rooms[0]._id;
      await Room.findByIdAndUpdate(roomId, {
        status: "chatting",
      });
    }
    return new Response(JSON.stringify(rooms), { status: 200 });
  } catch (error) {
    return new Response(error as any, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const room = await Room.create({
      status: "waiting",
    });
    return new Response(JSON.stringify(room), { status: 200 });
  } catch (error) {
    return new Response("failed to create new room", { status: 500 });
  }
}
