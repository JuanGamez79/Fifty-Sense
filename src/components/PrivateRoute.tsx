import { Navigate, Outlet } from "react-router-dom"

export default function PrivateRoute() {
  const token = localStorage.getItem("token") // or your auth state

  return token ? <Outlet /> : <Navigate to="/" replace />
}