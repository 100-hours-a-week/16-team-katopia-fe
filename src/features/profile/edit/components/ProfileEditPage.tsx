"use client";

import ProfileEditCancelModal from "./ProfileEditCancelModal";
import ProfileEditForm from "./ProfileEditForm";
import { useProfileEdit } from "../hooks/useProfileEdit";

export default function ProfileEditPage() {
  const {
    ready,
    isAuthenticated,
    form,
    onSubmit,
    onBackImmediate,
    handleConfirmCancel,
    showCancelModal,
    setShowCancelModal,
    preview,
    imageError,
    handleImageChange,
    handleRemoveImage,
    duplicateError,
    duplicateSuccess,
    isChecking,
    handleDuplicateCheck,
    toastMessage,
    setStylesRef,
    styleErrorTimeoutRef,
    initialStyles,
    initialNickname,
    imageBlob,
    removeImage,
  } = useProfileEdit();

  if (!ready || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <ProfileEditForm
        form={form}
        onSubmit={onSubmit}
        onBackImmediate={onBackImmediate}
        setShowCancelModal={setShowCancelModal}
        preview={preview}
        imageError={imageError}
        onImageChange={handleImageChange}
        onRemoveImage={handleRemoveImage}
        duplicateError={duplicateError}
        duplicateSuccess={duplicateSuccess}
        isChecking={isChecking}
        onDuplicateCheck={handleDuplicateCheck}
        toastMessage={toastMessage}
        setStylesRef={setStylesRef}
        styleErrorTimeoutRef={styleErrorTimeoutRef}
        initialStyles={initialStyles}
        initialNickname={initialNickname}
        imageBlob={imageBlob}
        removeImage={removeImage}
      />

      <ProfileEditCancelModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
      />
    </>
  );
}
