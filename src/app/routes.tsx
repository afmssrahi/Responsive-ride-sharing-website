import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { GetStartedPage } from "./pages/GetStartedPage";
import { FindRidePage } from "./pages/FindRidePage";
import { OfferRidePage } from "./pages/OfferRidePage";
import { RideDetailPage } from "./pages/RideDetailPage";
import { DriveRequirementsPage } from "./pages/DriveRequirementsPage";
import { DriverApplyPage } from "./pages/DriverApplyPage";
import { DriverApplySubmittedPage } from "./pages/DriverApplySubmittedPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminAccountPage } from "./pages/admin/AdminAccountPage";
import { UserDashboard } from "./pages/user/UserDashboard";
import { UserAccountPage } from "./pages/user/UserAccountPage";
import { DriverDashboard } from "./pages/driver/DriverDashboard";
import { DriverAccountPage } from "./pages/driver/DriverAccountPage";
import { ChatPage } from "./pages/ChatPage";
import { Navbar } from "./components/Navbar";

function RootLayout() {
  return (
    <>
      <Navbar />
      <LandingPage />
    </>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <RootLayout /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/get-started", element: <GetStartedPage /> },
  { path: "/find-ride", element: <FindRidePage /> },
  { path: "/offer-ride", element: <OfferRidePage /> },
  { path: "/ride/:rideId", element: <RideDetailPage /> },
  { path: "/drive/requirements", element: <DriveRequirementsPage /> },
  { path: "/drive/apply", element: <DriverApplyPage /> },
  { path: "/drive/apply/submitted", element: <DriverApplySubmittedPage /> },
  { path: "/admin", element: <AdminDashboard /> },
  { path: "/admin/account", element: <AdminAccountPage /> },
  { path: "/dashboard", element: <UserDashboard /> },
  { path: "/dashboard/account", element: <UserAccountPage /> },
  { path: "/driver", element: <DriverDashboard /> },
  { path: "/driver/account", element: <DriverAccountPage /> },
  { path: "/chat/:rideId", element: <ChatPage /> },
]);