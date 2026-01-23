"use client";

import { useEffect, useState } from "react";
import ProfileHeader from "./ProfileHeader";
import ProfileSummary from "./ProfileSummary";
import ProfilePostGrid from "./ProfilePostGrid";
import ProfileWithdrawModal from "./ProfileWithdrawModal";
import ProfileLogoutModal from "./ProfileLogoutModal";
import { API_BASE_URL } from "@/src/config/api";
import { getAccessToken } from "@/src/lib/auth";

type Profile = {
  nickname: string;
  profileImageUrl: string | null;
  gender: "male" | "female" | null;
  height: number | null;
  weight: number | null;
  style: string[];
};

export default function MyProfilePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  /* -------------------------
     내 정보 조회
  ------------------------- */
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/api/members/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        console.log(res);

        if (!res.ok) {
          console.log((await res.json()).code);
          throw new Error("내 정보 조회 실패");
        }

        const json = await res.json();
        setProfile(json.data.profile);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const handleToggleMenu = () => setMenuOpen((prev) => !prev);
  const handleCloseMenu = () => setMenuOpen(false);
  const handleOpenWithdraw = () => setWithdrawOpen(true);
  const handleCloseWithdraw = () => setWithdrawOpen(false);
  const handleOpenLogout = () => setLogoutOpen(true);
  const handleCloseLogout = () => setLogoutOpen(false);

  return (
    <>
      <div className="min-h-screen bg-white">
        <ProfileHeader
          menuOpen={menuOpen}
          onToggleMenu={handleToggleMenu}
          onCloseMenu={handleCloseMenu}
          onLogout={handleOpenLogout}
          onWithdraw={handleOpenWithdraw}
        />

        {/* ✅ 데이터 내려줌 */}
        <ProfileSummary profile={profile} loading={loading} />

        <ProfilePostGrid />
      </div>

      <ProfileWithdrawModal
        open={withdrawOpen}
        onClose={handleCloseWithdraw}
        onConfirm={() => {
          handleCloseWithdraw();
        }}
      />

      <ProfileLogoutModal open={logoutOpen} onClose={handleCloseLogout} />
    </>
  );
}
