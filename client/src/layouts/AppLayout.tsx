import { Link, Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <>
      <nav className="navbar navbar-expand navbar-dark bg-primary">
        <div className="container">
          <Link className="navbar-brand" to="/">
            Macau678
          </Link>
          <div className="navbar-nav">
            <Link className="nav-link" to="/">
              Home
            </Link>
            <Link className="nav-link" to="/health">
              Health
            </Link>
          </div>
        </div>
      </nav>
      <Outlet />
    </>
  );
}
