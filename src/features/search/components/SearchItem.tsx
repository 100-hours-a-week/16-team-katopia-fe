import Image from "next/image";
import { memo } from "react";

interface Props {
  src: string;
}

function SearchItem({ src }: Props) {
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded">
      <Image
        src={src}
        alt="검색 이미지"
        fill
        className="object-cover"
        sizes="(max-width: 390px) 33vw"
      />
    </div>
  );
}

export default memo(SearchItem);
