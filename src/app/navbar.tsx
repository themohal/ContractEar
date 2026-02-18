import NavbarAuth from "./navbar-auth";

export default function Navbar() {
  return (
    <nav className="no-print sticky top-0 z-50 border-b border-card-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="/" className="flex items-center gap-2 text-lg font-bold">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            className="text-accent-light"
          >
            <path
              d="M14 2C7.373 2 2 7.373 2 14s5.373 12 12 12 12-5.373 12-12S20.627 2 14 2zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S4 19.523 4 14 8.477 4 14 4zm-2 5a1 1 0 00-1 1v8a1 1 0 002 0v-8a1 1 0 00-1-1zm4 2a1 1 0 00-1 1v4a1 1 0 002 0v-4a1 1 0 00-1-1z"
              fill="currentColor"
            />
          </svg>
          ContractEar
        </a>
        <NavbarAuth />
      </div>
    </nav>
  );
}
