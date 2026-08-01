export function GET() {
  return Response.redirect(
    'https://raw.githubusercontent.com/bograh/cargo/dev/install.sh',
    302,
  );
}
