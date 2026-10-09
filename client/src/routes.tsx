import { createBrowserRouter, Navigate } from "react-router-dom";
import RootLayout from "@/layout/RootLayout";
import AuthLayout from "@/layout/AuthLayout";
import AppShell from "@/layout/AppShell";
import ErrorBoundary from "@/components/ErrorBoundary";

import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import CreateTeamPage from "@/pages/onboarding/CreateTeamPage";
import WaitingPage from "@/pages/onboarding/WaitingPage";
import DashboardPage from "@/pages/DashboardPage";
import BoardPage from "@/pages/BoardPage";
import IssuesPage from "@/pages/IssuesPage";
import IssueDetailPage from "@/pages/IssueDetailPage";
import TeamPage from "@/pages/TeamPage";
import SettingsPage from "@/pages/SettingsPage";

import NotFoundPage from "@/pages/NotFoundPage";
import ProfilePage from "@/pages/ProfilePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },

      // Public auth routes (redirect to dashboard if already logged in)
      {
        element: <AuthLayout authentication={false} />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "signup", element: <SignupPage /> },
        ],
      },

      // Onboarding (authenticated, but no team required)
      {
        element: <AuthLayout authentication={true} requireNoTeam={true} />,
        children: [
          { path: "onboarding/create-team", element: <CreateTeamPage /> },
          { path: "onboarding/waiting",     element: <WaitingPage /> },
        ],
      },

      // Protected app routes (authenticated + has team)
      {
        element: <AuthLayout authentication={true} />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: "dashboard", element: <DashboardPage /> },
              { path: "board", element: <BoardPage /> },
              { path: "issues", element: <IssuesPage /> },
              { path: "issues/:id", element: <IssueDetailPage /> },
              { path: "team", element: <TeamPage /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "profile", element: <ProfilePage /> },
            ],
          },
        ],
      },

      // Fallback 404 route
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default router;
