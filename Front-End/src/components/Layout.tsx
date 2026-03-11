import NavBar from './NavBar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <NavBar />
      <main style={{ padding: 16 }}>{children}</main>
    </div>
  )
}
