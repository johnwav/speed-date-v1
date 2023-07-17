// import { NextResponse } from "next/server";
import dbConnect from "@/utils/database";
import Room from "@/models/Rooms";
import {
  RtcRole,
  RtcTokenBuilder,
  RtmTokenBuilder,
  RtmRole,
} from "agora-access-token";
import { NextRequest } from "next/server";

function getRtcToken(roomId: string, userId: string) {
  const appID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
  const appCertificate = process.env.NEXT_PUBLIC_AGORA_APP_CERT!;
  const channelName = roomId;
  const account = userId;
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;
  const currentTimeStamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimeStamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithAccount(
    appID,
    appCertificate,
    channelName,
    account,
    role,
    privilegeExpiredTs
  );

  return token;
}

function getRtmToken(userId: string) {
  const appID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
  const appCertificate = process.env.NEXT_PUBLIC_AGORA_APP_CERT!;
  const account = userId;
  const expirationTimeInSeconds = 3600;
  const currentTimeStamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimeStamp + expirationTimeInSeconds;

  const token = RtmTokenBuilder.buildToken(
    appID,
    appCertificate,
    account,
    RtmRole.Rtm_User,
    privilegeExpiredTs
  );

  return token;
}

export async function GET(request: NextRequest) {
  const userId = await request.nextUrl.searchParams.get("userId")!;
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
      return new Response(
        JSON.stringify({
          rooms,
          token: getRtcToken(roomId, userId),
        }),
        { status: 200 }
      );
    } else {
      return new Response(JSON.stringify({ rooms: [], token: null }), {
        status: 200,
      });
    }
  } catch (error) {
    return new Response((error as any).message, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId")!;

  try {
    await dbConnect();
    const room = await Room.create({
      status: "waiting",
    });
    return new Response(
      JSON.stringify({
        room,
        token: getRtcToken(room._id, userId),
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response("failed to create new room", { status: 500 });
  }
}
