import { createBrowserRouter, Navigate } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { PrivateRoute } from "./components/auth/PrivateRoute";
import Dashboard from "./pages/Dashboard";
import Workouts from "./pages/Workouts";
import Exercises from "./pages/Exercises";
import ProgressPage from "./pages/Progress";
import Nutrition from "./pages/Nutrition";
import DietPlanDetails from "./pages/DietPlanDetails";
import Profile from "./pages/Profile";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/",
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "dashboard", Component: Dashboard },
      { path: "workouts", Component: Workouts },
      { path: "workout", element: <Navigate to="/workouts" replace /> },
      { path: "exercises", Component: Exercises },
      { path: "progress", Component: ProgressPage },
      { path: "nutrition", Component: Nutrition },
      { path: "nutrition/:planId", Component: DietPlanDetails },
      { path: "diet", element: <Navigate to="/nutrition" replace /> },
      { path: "profile", Component: Profile },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
