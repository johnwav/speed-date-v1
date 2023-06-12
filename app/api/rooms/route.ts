import { NextResponse } from "next/server";
import dbConnect from "@/utils/database";
import Room from "@/models/Rooms";

export async function GET(request: Request) {

  try {
    await dbConnect();
    const rooms = await Room.find({});
    return new Response(JSON.stringify(rooms), { status: 200 });
  } catch (error) {
    return new Response(error, { status: 400 });
  }
}
