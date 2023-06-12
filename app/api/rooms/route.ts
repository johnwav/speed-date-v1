import { NextResponse } from "next/server";
import dbConnect from "@/utils/database";
import Room from "@/models/Rooms";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const rooms = await Room.aggregate([
      { $match: { status: "waiting" } },
      { $sample: { size: 1 } },
    ]);
    return new Response(JSON.stringify(rooms), { status: 200 });
  } catch (error) {
    return new Response(error as any, { status: 400 });
  }
}
