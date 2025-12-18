import { StreamClient } from '@stream-io/node-sdk';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const streamSecret = process.env.STREAM_SECRET;

    if (!apiKey || !streamSecret) {
      return NextResponse.json({ error: 'Missing Stream credentials' }, { status: 500 });
    }

    const serverClient = new StreamClient(apiKey, streamSecret);
    const body = await request.json();
    const { users } = body;

    if (!users || !Array.isArray(users)) {
      return NextResponse.json({ error: 'Invalid users array' }, { status: 400 });
    }

    // Map users to Stream format if needed, ensuring required fields
    const streamUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      image: u.image,
      role: u.role === 'admin' ? 'admin' : 'user', // Map roles safely
    }));

    await serverClient.upsertUsers(streamUsers);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
