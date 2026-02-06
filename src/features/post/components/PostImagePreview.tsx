// components/PostImagePreview.tsx
type Props = {
  images: { id: string; url: string }[];
};

export default function PostImagePreview({ images }: Props) {
  if (images.length === 0) return null;
  const isSingle = images.length === 1;

  return (
    <div
      className={`mt-4 w-full ${
        isSingle ? "flex justify-center" : "overflow-x-auto"
      }`}
    >
      <div
        className={`flex w-full min-w-0 ${
          isSingle ? "justify-center" : "gap-3 snap-x snap-mandatory"
        }`}
      >
        {images.map((img) => (
          <div
            key={img.id}
            className={`relative overflow-hidden rounded-[5px] bg-gray-200 ${
              isSingle
                ? "h-[55vh] w-88.75"
                : "h-[55vh] w-88.75 shrink-0 snap-start"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
