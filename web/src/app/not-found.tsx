import Link from "next/link";
export default function NotFound() {
  return (
    <div className="fatal">
      <h1>404</h1>
      <p>That path is still unexplored.</p>
      <Link className="text-link" href="/en">
        Return home ↗
      </Link>
    </div>
  );
}
