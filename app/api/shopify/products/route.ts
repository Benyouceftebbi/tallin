import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  const { shopDomain, accessToken } = await req.json();

  if (!shopDomain || !accessToken) {
    return NextResponse.json({ error: "Missing shopDomain or accessToken" }, { status: 400 });
  }

  try {
    const response = await axios.get(`https://${shopDomain}/admin/api/2024-01/products.json?status=active`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Shopify fetch error:", error.message);
    return NextResponse.json({ error: "Failed to fetch Shopify products" }, { status: 500 });
  }
}