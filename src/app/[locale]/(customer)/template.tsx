/**
 * Re-mounted on every navigation, so each page enters with the same soft rise-and-fade
 * (globals.css, .fa-page). Purely visual; reduced motion turns it off.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return <div className="fa-page flex flex-1 flex-col">{children}</div>;
}
