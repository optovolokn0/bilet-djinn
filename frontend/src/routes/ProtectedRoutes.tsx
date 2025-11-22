import { Navigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../hooks";
import { logout } from "../features/auth/authSlice"; // импортируешь свой экшен
import type { JSX } from "react";

export function ProtectedRoute({
  children,
  role
}: {
  children: JSX.Element;
  role?: "reader" | "library";
}) {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();

  if (!user) {
    dispatch(logout());            // <--- очищаем данные
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={`/${user.role}/catalog`} replace />;
  }

  return children;
}
