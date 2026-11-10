import type { ReactNode } from "react";

interface ActivationScreenShellProps {
  children: ReactNode;
  sidebar: ReactNode;
}

export function ActivationScreenShell({
  children,
  sidebar
}: ActivationScreenShellProps) {
  return (
    <main className="activation-shell">
      <section className="activation-frame">
        <aside className="activation-sidebar">{sidebar}</aside>
        <section className="activation-content">{children}</section>
      </section>
    </main>
  );
}
