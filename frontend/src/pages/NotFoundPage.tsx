import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="not-found-page">
      <span className="luxury-tag">A LITTLE DETOUR</span>
      <h1>This page is<br /><em>out of style.</em></h1>
      <p>We couldn’t find the page you were looking for.</p>
      <Link to="/" className="btn-luxury-primary">Return to the salon</Link>
    </section>
  );
}
