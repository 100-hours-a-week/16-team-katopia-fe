"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProfileHeader from "./ProfileHeader";
import ProfileSummary from "./ProfileSummary";
import ProfilePostGrid from "./ProfilePostGrid";
import ProfileWithdrawModal from "./ProfileWithdrawModal";
import ProfileLogoutModal from "./ProfileLogoutModal";
import { API_BASE_URL } from "@/src/config/api";
import { getAccessToken } from "@/src/lib/auth";
import {
  getCachedProfileImage,
  setCachedProfileImage,
} from "@/src/features/profile/utils/profileImageCache";

type Profile = {
  nickname: string;
  profileImageUrl: string | null;
  gender: "male" | "female" | null;
  height: number | null;
  weight: number | null;
  style: string[];
};

export default function MyProfilePage() {
  const searchParams = useSearchParams();
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
          cache: "no-store",
        });

        // console.log(res);

        if (!res.ok) {
          console.log((await res.json()).code);
          throw new Error("내 정보 조회 실패");
        }

        const json = await res.json();
        const rawProfile = json.data.profile;
        const normalizedGender =
          rawProfile.gender === "M" || rawProfile.gender === "MALE"
            ? "male"
            : rawProfile.gender === "F" || rawProfile.gender === "FEMALE"
              ? "female"
              : null;

        if (rawProfile.profileImageUrl) {
          setCachedProfileImage(rawProfile.profileImageUrl);
        }
        const cachedImage = getCachedProfileImage();

        setProfile({
          ...rawProfile,
          gender: normalizedGender,
          profileImageUrl: rawProfile.profileImageUrl ?? cachedImage,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [searchParams.toString()]);

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
