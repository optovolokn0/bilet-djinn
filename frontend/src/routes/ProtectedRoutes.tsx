import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks";
import type { JSX } from "react";

export function ProtectedRoute({
  children,
  role
}: {
  children: JSX.Element;
  role?: "reader" | "library";
}) {
  const user = useAppSelector((s) => s.auth.user);

  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role)
    return <Navigate to={`/${user.role}/catalog`} replace />;

  return children;
}
