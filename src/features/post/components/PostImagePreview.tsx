// components/PostImagePreview.tsx
import Image from "next/image";

type Props = {
  images: { id: string; url: string }[];
};

export default function PostImagePreview({ images }: Props) {
  return (
    <div className="mt-4 overflow-x-auto">
      <div className="flex gap-3">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative h-[60vh] aspect-[3/4] flex-shrink-0 rounded-xl overflow-hidden bg-gray-200"
          >
            <Image src={img.url} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
