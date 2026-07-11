// Layout passthrough — el sidebar y topbar viven en app/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
