// components/PostImagePreview.tsx
import Image from "next/image";

type Props = {
  images: { id: string; url: string }[];
};

export default function PostImagePreview({ images }: Props) {
  if (images.length === 0) return null;
  const isSingle = images.length === 1;

  return (
    <div className={`mt-4 ${isSingle ? "" : "overflow-x-auto"}`}>
      <div className={`flex gap-3 ${isSingle ? "" : "snap-x snap-mandatory"}`}>
        {images.map((img) => (
          <div
            key={img.id}
            className={`relative overflow-hidden rounded-[3px] bg-gray-200 ${
              isSingle
                ? "w-full aspect-3/4"
                : "h-[60vh] aspect-3/4 shrink-0 snap-start"
            }`}
          >
            <Image src={img.url} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
