export function GET() {
  return Response.json(
    { error: "This legacy endpoint has been retired." },
    { status: 410 },
  );
}
export const POST = GET;
