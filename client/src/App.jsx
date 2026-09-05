import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './auth.jsx';
import { Layout } from './Layout.jsx';
import { Home } from './pages/Home.jsx';
import { Listings } from './pages/Listings.jsx';
import { ListingDetail } from './pages/ListingDetail.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { Saved } from './pages/Saved.jsx';
import { BuyerInquiries } from './pages/BuyerInquiries.jsx';
import { OwnerDashboard } from './pages/OwnerDashboard.jsx';
import { OwnerListings } from './pages/OwnerListings.jsx';
import { OwnerListingForm } from './pages/OwnerListingForm.jsx';
import { OwnerInquiries } from './pages/OwnerInquiries.jsx';
import { Profile } from './pages/Profile.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/saved"
          element={
            <RequireAuth>
              <Saved />
            </RequireAuth>
          }
        />
        <Route
          path="/inquiries"
          element={
            <RequireAuth>
              <BuyerInquiries />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/owner"
          element={
            <RequireAuth role="owner">
              <OwnerDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/owner/listings"
          element={
            <RequireAuth role="owner">
              <OwnerListings />
            </RequireAuth>
          }
        />
        <Route
          path="/owner/listings/new"
          element={
            <RequireAuth role="owner">
              <OwnerListingForm />
            </RequireAuth>
          }
        />
        <Route
          path="/owner/listings/:id/edit"
          element={
            <RequireAuth role="owner">
              <OwnerListingForm />
            </RequireAuth>
          }
        />
        <Route
          path="/owner/inquiries"
          element={
            <RequireAuth role="owner">
              <OwnerInquiries />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
