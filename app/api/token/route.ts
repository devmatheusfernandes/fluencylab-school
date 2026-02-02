import { StreamClient } from '@stream-io/node-sdk';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    if (!apiKey) {
      //console.error('API key is missing.');
      return new Response('API key is missing.', { status: 500 });
    }

    const streamSecret = process.env.STREAM_SECRET;
    if (!streamSecret) {
      //console.error('Stream secret is missing.');
      return new Response('Stream secret is missing.', { status: 500 });
    }

    const serverClient = new StreamClient(apiKey, streamSecret);
    const body = await request.json();

    const userId = body?.userId;
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      //console.error('Invalid user ID:', userId);
      return new Response('Invalid user ID.', { status: 400 });
    }

    const token = serverClient.generateUserToken({ 
      user_id: userId,
      iat: Math.floor(Date.now() / 1000) - 60 
    });

    const response = {
      userId: userId,
      token: token,
    };

    return Response.json(response);
  } catch (error) {
    //console.error('Error generating token:', error);
    return new Response('Internal server error.', { status: 500 });
  }
}