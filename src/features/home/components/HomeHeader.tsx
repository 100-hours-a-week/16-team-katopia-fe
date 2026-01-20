import Image from "next/image";

export default function HomeHeader() {
  return (
    <header className="absolute top-0 left-0 h-14 px-4 flex items-center">
      <Image
        src="/images/logo.png"
        alt="FITCHECK"
        width={96}
        height={24}
        priority
      />
    </header>
  );
}
