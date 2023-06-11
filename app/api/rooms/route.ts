
import { NextResponse } from "next/server";
import dbConnect from "@/utils/database";
import Room from "@/models/Rooms";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const rooms = await Room.find({});
    return new Response(JSON.stringify(rooms), { status: 200 });
  } catch (error) {
    return new Response("no method for this endpoint", { status: 400 });
  }

  return NextResponse.json({ name: "John Doe" }, { status: 200 });
  /// new

  // const { method } = req;

  // await dbConnect();

  // switch (method) {
  //   case "GET":
  //     try {
  //       const rooms = await Room.find({});
  //       res.status(200).json(rooms);
  //     } catch (error) {
  //       res.status(400).json(error.message as any);
  //     }
  //     break;
  //   default:
  //     res.status(400).json("no method for this endpoint");
  //     break;
  // }
}

// api/users.js
