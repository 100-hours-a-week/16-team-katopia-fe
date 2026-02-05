"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { MutableRefObject } from "react";
import Image from "next/image";
import {
  FormProvider,
  useController,
  useFormContext,
  useFormState,
  useWatch,
  type UseFormReturn,
} from "react-hook-form";

import ProfileImageUploader from "@/src/features/signup/components/SignupStep1/ProfileImageUploader";
import NicknameField from "@/src/features/signup/components/SignupStep1/NicknameField";
import GenderSection from "@/src/features/signup/components/SignupStep2/GenderSection";
import BodyInfoSection from "@/src/features/signup/components/SignupStep2/BodyInfoSection";
import StyleSection from "@/src/features/signup/components/SignupStep2/StyleSection";
import type { ProfileEditFormValues } from "../hooks/useProfileEdit";
import ProfileEditView from "./ProfileEditView";

type Props = {
  form: UseFormReturn<ProfileEditFormValues>;
  onSubmit: (values: ProfileEditFormValues) => void | Promise<void>;
  onBackImmediate: () => void;
  setShowCancelModal: (next: boolean) => void;
  preview: string | null;
  imageError: string | null;
  onImageChange: (file: File) => void;
  onRemoveImage: () => void;
  duplicateError: string | null;
  duplicateSuccess: string | null;
  isChecking: boolean;
  onDuplicateCheck: (nickname: string) => boolean | Promise<boolean>;
  toastMessage: string | null;
  setStylesRef: (next: string[]) => void;
  styleErrorTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  initialStyles: string[];
  initialNickname: string | null;
  imageBlob: Blob | null;
  removeImage: boolean;
};

type HeaderSharedProps = {
  onBackImmediate: () => void;
  setShowCancelModal: (next: boolean) => void;
  imageBlob: Blob | null;
  removeImage: boolean;
  initialStyles: string[];
  subscribeStyles: (listener: () => void) => () => void;
  getStylesSnapshot: () => string[];
};

const useHeaderBackState = ({
  imageBlob,
  removeImage,
}: HeaderSharedProps) => {
  const { control } = useFormContext<ProfileEditFormValues>();
  const { isDirty } = useFormState<ProfileEditFormValues>({
    control,
    name: ["nickname", "gender", "height", "weight"],
  });

  const hasChanges =
    Boolean(imageBlob) || removeImage || isDirty;

  return { hasChanges };
};

const useHeaderSubmitState = ({
  imageBlob,
  removeImage,
  initialStyles,
  subscribeStyles,
  getStylesSnapshot,
}: HeaderSharedProps) => {
  const { control } = useFormContext<ProfileEditFormValues>();
  const { isDirty } = useFormState<ProfileEditFormValues>({
    control,
    name: ["nickname", "gender", "height", "weight"],
  });
  const nickname = useWatch<ProfileEditFormValues>({ name: "nickname" }) ?? "";
  const gender = useWatch<ProfileEditFormValues>({ name: "gender" }) ?? "";
  const styles = useSyncExternalStore(
    subscribeStyles,
    getStylesSnapshot,
    getStylesSnapshot,
  );

  const normalizedStyles = [...styles].sort().join("|");
  const normalizedInitialStyles = [...initialStyles].sort().join("|");

  const hasRequiredValues =
    Boolean(String(nickname ?? "").trim()) && Boolean(gender);

  const hasChanges =
    Boolean(imageBlob) ||
    removeImage ||
    isDirty ||
    normalizedStyles !== normalizedInitialStyles;

  return { hasChanges, hasRequiredValues };
};

const HeaderBackButton = memo(
  (props: HeaderSharedProps) => {
    const { hasChanges } = useHeaderBackState(props);
    const { onBackImmediate, setShowCancelModal } = props;
    const handleBack = useCallback(() => {
      if (hasChanges) {
        setShowCancelModal(true);
        return;
      }
      onBackImmediate();
    }, [hasChanges, onBackImmediate, setShowCancelModal]);

    return (
      <button type="button" aria-label="뒤로가기" onClick={handleBack}>
        <Image src="/icons/back.svg" alt="뒤로가기" width={24} height={24} />
      </button>
    );
  },
);

HeaderBackButton.displayName = "HeaderBackButton";

const HeaderSubmitButton = memo((props: HeaderSharedProps) => {
  const { hasChanges, hasRequiredValues } = useHeaderSubmitState(props);

  return (
    <button
      type="submit"
      disabled={!hasChanges || !hasRequiredValues}
      className={`text-[14px] font-semibold ${
        hasChanges && hasRequiredValues ? "text-black" : "text-gray-300"
      }`}
    >
      완료
    </button>
  );
});

HeaderSubmitButton.displayName = "HeaderSubmitButton";

const HeaderSection = memo(
  (props: HeaderSharedProps) => (
    <header className="flex items-center justify-between px-4 py-3">
      <HeaderBackButton {...props} />
      <h1 className="text-[14px] font-semibold">프로필 수정</h1>
      <HeaderSubmitButton {...props} />
    </header>
  ),
);

HeaderSection.displayName = "HeaderSection";

type ProfileImageSectionProps = {
  preview: string | null;
  imageError: string | null;
  onImageChange: (file: File) => void;
  onRemoveImage: () => void;
};

const ProfileImageSection = memo(
  ({
    preview,
    imageError,
    onImageChange,
    onRemoveImage,
  }: ProfileImageSectionProps) => {
    const handleImageInputChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        onImageChange(file);
        event.target.value = "";
      },
      [onImageChange],
    );

    return (
      <div className="px-4">
        <ProfileImageUploader
          preview={preview}
          error={imageError}
          onChange={handleImageInputChange}
          onRemove={onRemoveImage}
        />
      </div>
    );
  },
);

ProfileImageSection.displayName = "ProfileImageSection";

type NicknameSectionProps = {
  duplicateError: string | null;
  duplicateSuccess: string | null;
  onDuplicateCheck: (nickname: string) => boolean | Promise<boolean>;
  isChecking: boolean;
  initialNickname: string | null;
};

const NicknameSection = memo(
  ({
    duplicateError,
    duplicateSuccess,
    onDuplicateCheck,
    isChecking,
    initialNickname,
  }: NicknameSectionProps) => {
    const { control } = useFormContext<ProfileEditFormValues>();

    return (
      <section className="px-4">
        <NicknameField
          control={control}
          duplicateError={duplicateError}
          duplicateSuccess={duplicateSuccess}
          onDuplicateCheck={onDuplicateCheck}
          isChecking={isChecking}
          initialNickname={initialNickname}
        />
      </section>
    );
  },
);

NicknameSection.displayName = "NicknameSection";

const GenderSectionBlock = memo(() => {
  const { register } = useFormContext<ProfileEditFormValues>();
  const { errors } = useFormState<ProfileEditFormValues>({
    name: "gender",
  });

  return (
    <section className="px-4">
      <GenderSection
        register={register("gender")}
        error={errors.gender?.message}
        maleValue="MALE"
        femaleValue="FEMALE"
        labelClassName="text-sm"
      />
    </section>
  );
});

GenderSectionBlock.displayName = "GenderSectionBlock";

const BodyInfoSectionBlock = memo(() => {
  const { control, setValue } = useFormContext<ProfileEditFormValues>();
  const { field: heightField } = useController({ name: "height", control });
  const { field: weightField } = useController({ name: "weight", control });
  const { errors } = useFormState<ProfileEditFormValues>({
    name: ["height", "weight"],
  });

  const weightInputRef = useRef<HTMLInputElement | null>(null);

  const handleNumericChange = useCallback(
    (field: "height" | "weight", raw: string, focusNext?: () => void) => {
      const digits = raw.replace(/\D/g, "").slice(0, 3);
      const normalized = digits ? String(parseInt(digits, 10)) : "";

      setValue(field, normalized, { shouldDirty: true, shouldValidate: true });

      if (normalized.length === 3 && focusNext) focusNext();
    },
    [setValue],
  );

  const onHeightChange = useCallback(
    (value: string) =>
      handleNumericChange("height", value, () =>
        weightInputRef.current?.focus(),
      ),
    [handleNumericChange],
  );

  const onWeightChange = useCallback(
    (value: string) => handleNumericChange("weight", value),
    [handleNumericChange],
  );

  return (
    <section className="px-4">
      <BodyInfoSection
        heightValue={heightField.value ?? ""}
        weightValue={weightField.value ?? ""}
        onHeightChange={onHeightChange}
        onWeightChange={onWeightChange}
        weightInputRef={weightInputRef}
        heightError={errors.height?.message as string | undefined}
        weightError={errors.weight?.message as string | undefined}
        labelClassName="text-sm"
      />
    </section>
  );
});

BodyInfoSectionBlock.displayName = "BodyInfoSectionBlock";

type StyleSectionBlockProps = {
  initialStyles: string[];
  setStylesRef: (next: string[]) => void;
  styleErrorTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  setStylesSnapshot: (next: string[]) => void;
};

const StyleSectionBlock = memo(
  ({
    initialStyles,
    setStylesRef,
    styleErrorTimeoutRef,
    setStylesSnapshot,
  }: StyleSectionBlockProps) => {
    const [styles, setStyles] = useState<string[]>(() => initialStyles);
    const [styleError, setStyleError] = useState<string | null>(null);

    useEffect(() => {
      setStyles(initialStyles);
    }, [initialStyles]);

    useEffect(() => {
      setStylesRef(styles);
      setStylesSnapshot(styles);
    }, [styles, setStylesRef, setStylesSnapshot]);

    const toggleStyle = useCallback(
      (style: string) => {
        setStyles((prev) => {
          if (prev.includes(style)) {
            return prev.filter((item) => item !== style);
          }

          if (prev.length >= 2) {
            setStyleError("선호 스타일은 최대 2개 선택 가능합니다.");
            styleErrorTimeoutRef.current = setTimeout(
              () => setStyleError(null),
              2000,
            );
            return prev;
          }

          return [...prev, style];
        });
      },
      [styleErrorTimeoutRef],
    );

    return (
      <section className="px-4 py-8">
        <StyleSection
          styles={styles}
          onToggle={toggleStyle}
          error={styleError}
          labelClassName="text-sm"
        />
      </section>
    );
  },
);

StyleSectionBlock.displayName = "StyleSectionBlock";

const Toast = memo(({ message }: { message: string | null }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-25 left-1/2 z-100 -translate-x-1/2 px-4">
      <div
        className="min-w-65 rounded-full bg-white px-8 py-3 text-center text-base font-semibold text-[#121212] shadow-lg"
        style={{ animation: "toastFadeIn 250ms ease-out forwards" }}
      >
        {message}
      </div>
    </div>
  );
});

Toast.displayName = "Toast";

export default function ProfileEditForm({
  form,
  onSubmit,
  onBackImmediate,
  setShowCancelModal,
  preview,
  imageError,
  onImageChange,
  onRemoveImage,
  duplicateError,
  duplicateSuccess,
  isChecking,
  onDuplicateCheck,
  toastMessage,
  setStylesRef,
  styleErrorTimeoutRef,
  initialStyles,
  initialNickname,
  imageBlob,
  removeImage,
}: Props) {
  const handleSubmit = useMemo(
    () => form.handleSubmit(onSubmit),
    [form, onSubmit],
  );

  const stylesStoreRef = useRef({
    value: initialStyles,
    listeners: new Set<() => void>(),
  });

  const getStylesSnapshot = useCallback(() => stylesStoreRef.current.value, []);

  const subscribeStyles = useCallback((listener: () => void) => {
    const store = stylesStoreRef.current;
    store.listeners.add(listener);
    return () => {
      store.listeners.delete(listener);
    };
  }, []);

  const setStylesSnapshot = useCallback((next: string[]) => {
    stylesStoreRef.current.value = next;
    stylesStoreRef.current.listeners.forEach((listener) => listener());
  }, []);

  useEffect(() => {
    setStylesSnapshot(initialStyles);
  }, [initialStyles, setStylesSnapshot]);

  return (
    <FormProvider {...form}>
      <ProfileEditView
        onSubmit={handleSubmit}
        header={
          <HeaderSection
            onBackImmediate={onBackImmediate}
            setShowCancelModal={setShowCancelModal}
            imageBlob={imageBlob}
            removeImage={removeImage}
            initialStyles={initialStyles}
            subscribeStyles={subscribeStyles}
            getStylesSnapshot={getStylesSnapshot}
          />
        }
        profileImage={
          <ProfileImageSection
            preview={preview}
            imageError={imageError}
            onImageChange={onImageChange}
            onRemoveImage={onRemoveImage}
          />
        }
        nickname={
          <NicknameSection
            duplicateError={duplicateError}
            duplicateSuccess={duplicateSuccess}
            onDuplicateCheck={onDuplicateCheck}
            isChecking={isChecking}
            initialNickname={initialNickname}
          />
        }
        gender={<GenderSectionBlock />}
        bodyInfo={<BodyInfoSectionBlock />}
        style={
          <StyleSectionBlock
            initialStyles={initialStyles}
            setStylesRef={setStylesRef}
            styleErrorTimeoutRef={styleErrorTimeoutRef}
            setStylesSnapshot={setStylesSnapshot}
          />
        }
        toast={<Toast message={toastMessage} />}
      />
    </FormProvider>
  );
}
