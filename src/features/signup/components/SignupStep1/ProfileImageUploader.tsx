import { memo, useRef } from "react";
import NextImage from "next/image";

type Props = {
  preview: string | null;
  error: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
};

const ProfileImageUploader = memo(
  ({ preview, error, onChange, onRemove }: Props) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    return (
      <div className="mt-10 flex flex-col items-center">
        <div className="relative">
          <label className="relative flex h-48 w-48 cursor-pointer items-center justify-center rounded-full bg-muted overflow-hidden border border-[#121212]">
            {preview ? (
              <NextImage
                src={preview}
                alt="프로필 미리보기"
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-4xl font-bold">+</span>
            )}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={onChange}
            />
          </label>

          {preview && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white border border-[#121212]"
            >
              ✕
            </button>
          )}
        </div>

        {error && <p className="mt-2 text-[11px] text-red-500">{error}</p>}
      </div>
    );
  },
);

ProfileImageUploader.displayName = "ProfileImageUploader";
export default ProfileImageUploader;
