import React, { type JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks';

export const ProtectedRoute = ({
  children,
  role,
}: {
  children: JSX.Element;
  role?: 'reader' | 'library' | 'admin';
}) => {
  const auth = useAppSelector((s) => s.auth);

  if (!auth.user) return <Navigate to="/login" replace />;

  if (role && auth.user.role !== role) {
    if (auth.user.role === 'reader') return <Navigate to="/reader/catalog" replace />;
    if (auth.user.role === 'library') return <Navigate to="/library/catalog" replace />;
  }

  return children;
};
