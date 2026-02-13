"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ProfileHeader from "./ProfileHeader";
import ProfileSummary from "./ProfileSummary";
import ProfilePostGrid from "./ProfilePostGrid";
import ProfileWithdrawModal from "./ProfileWithdrawModal";
import ProfileLogoutModal from "./ProfileLogoutModal";
import MyProfileVotesTab from "./MyProfileVotesTab";
import VoteDeleteConfirmModal from "./VoteDeleteConfirmModal";
import { clearAccessToken, setLoggedOutFlag } from "@/src/lib/auth";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import { withdrawMember } from "@/src/features/profile/api/withdrawMember";
import { useMyProfilePage } from "@/src/features/profile/hooks/useMyProfilePage";

function BookmarkIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M6 4.5h12a1 1 0 0 1 1 1v15l-7-4-7 4v-15a1 1 0 0 1 1-1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MyProfilePage() {
  const { setAuthenticated } = useAuth();
  const {
    router,
    ready,
    isAuthenticated,
    profile,
    loading,
    activeTab,
    handleTabChange,
    stats,
    handleFollowerClick,
    handleFollowingClick,
    posts,
    postsLoading,
    postsHasMore,
    observePosts,
    bookmarks,
    bookmarksLoading,
    bookmarksHasMore,
    observeBookmarks,
    votes,
    votesLoading,
    votesHasMore,
    observeVotes,
    voteMenuOpenId,
    setVoteMenuOpenId,
    voteDeleteOpen,
    pendingDeleteTitle,
    voteDeleting,
    openDeleteModal,
    closeDeleteModal,
    confirmDeleteVote,
  } = useMyProfilePage();

  const [menuOpen, setMenuOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawRedirecting, setWithdrawRedirecting] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated && !withdrawRedirecting) {
      router.replace("/home");
    }
  }, [ready, isAuthenticated, router, withdrawRedirecting]);

  /* -------------------------
     게시글 로딩
  ------------------------- */
  /* -------------------------
     UI
  ------------------------- */
  if (!ready || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-white">
        <ProfileHeader
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen((prev) => !prev)}
          onCloseMenu={() => setMenuOpen(false)}
          onLogout={() => setLogoutOpen(true)}
          onWithdraw={() => setWithdrawOpen(true)}
        />

        <ProfileSummary
          profile={profile}
          loading={loading}
          stats={stats}
          onFollowerClick={handleFollowerClick}
          onFollowingClick={handleFollowingClick}
        />

        <div className="mt-6 border-b border-gray-200 px-8">
          <div className="flex items-center justify-center gap-24">
            <button
              type="button"
              onClick={() => handleTabChange("posts")}
              className="relative flex h-12 w-12 items-center justify-center text-black"
              aria-pressed={activeTab === "posts"}
            >
              <Image
                src="/icons/grid.png"
                alt="게시물"
                width={28}
                height={28}
                className={activeTab === "posts" ? "opacity-100" : "opacity-40"}
              />
              {activeTab === "posts" && (
                <span className="absolute bottom-0 h-0.5 w-8 bg-black" />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("bookmarks")}
              className="relative flex h-12 w-12 items-center justify-center text-black"
              aria-pressed={activeTab === "bookmarks"}
            >
              <span
                className={
                  activeTab === "bookmarks" ? "opacity-100" : "opacity-40"
                }
              >
                <BookmarkIcon active={activeTab === "bookmarks"} />
              </span>
              {activeTab === "bookmarks" && (
                <span className="absolute bottom-0 h-0.5 w-8 bg-black" />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("votes")}
              className="relative flex h-12 w-12 items-center justify-center text-black"
              aria-pressed={activeTab === "votes"}
            >
              <Image
                src="/icons/votee.svg"
                alt="투표"
                width={28}
                height={28}
                className={activeTab === "votes" ? "opacity-100" : "opacity-40"}
              />
              {activeTab === "votes" && (
                <span className="absolute bottom-0 h-0.5 w-8 bg-black" />
              )}
            </button>
          </div>
        </div>

        {activeTab === "posts" && (
          <>
            <ProfilePostGrid
              posts={posts}
              loading={postsLoading}
              detailQuery="from=profile&tab=posts"
            />
            {postsHasMore && <div ref={observePosts} className="h-24" />}
          </>
        )}

        {activeTab === "bookmarks" && (
          <>
            <ProfilePostGrid
              posts={bookmarks}
              loading={bookmarksLoading}
              detailQuery="from=profile&tab=bookmarks"
            />
            {bookmarksHasMore && (
              <div ref={observeBookmarks} className="h-24" />
            )}
          </>
        )}

        {activeTab === "votes" && (
          <MyProfileVotesTab
            votes={votes}
            loading={votesLoading}
            hasMore={votesHasMore}
            observe={observeVotes}
            voteMenuOpenId={voteMenuOpenId}
            onToggleMenu={(id) =>
              setVoteMenuOpenId((prev) => (prev === id ? null : id))
            }
            onDeleteClick={openDeleteModal}
          />
        )}
      </div>

      <ProfileWithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        confirmDisabled={withdrawing}
        confirmLabel={withdrawing ? "처리 중..." : "확인"}
        onConfirm={async () => {
          if (withdrawing) return;
          setWithdrawing(true);
          try {
            await withdrawMember();
            setWithdrawRedirecting(true);
            setWithdrawOpen(false);
            router.replace("/withdraw/success");
            clearAccessToken();
            setLoggedOutFlag(true);
            setAuthenticated(false);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "회원 탈퇴에 실패했습니다.";
            alert(message);
          } finally {
            setWithdrawing(false);
          }
        }}
      />

      <ProfileLogoutModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
      />

      <VoteDeleteConfirmModal
        open={voteDeleteOpen}
        title={pendingDeleteTitle}
        deleting={voteDeleting}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteVote}
      />
    </>
  );
}
