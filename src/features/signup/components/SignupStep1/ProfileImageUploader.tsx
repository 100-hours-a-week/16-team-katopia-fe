import { memo, useRef } from "react";

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
          <label
            className="relative flex h-48 w-48 cursor-pointer items-center justify-center rounded-full bg-muted overflow-hidden border border-[#121212]"
            style={{ contain: "layout paint size" }}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="프로필 미리보기"
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <span className="text-4xl font-bold">+</span>
              </div>
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
              className="absolute right-2 top-2 h-8 w-8 rounded-full border border-[#121212] bg-white"
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
