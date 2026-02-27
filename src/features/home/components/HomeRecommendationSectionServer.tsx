import { cookies } from "next/headers";
import HomeRecommendationSectionClient from "./HomeRecommendationSectionClient";
import {
  getHomeMembersServer,
  toRecommendationMembers,
} from "@/src/features/home/api/getHomeMembers";

type HomeRecommendationSectionServerProps = {
  // 추천 데이터 갱신 주기(초)
  revalidateSeconds?: number;
};

function toCookieHeader(entries: { name: string; value: string }[]) {
  // next/headers의 쿠키 스토어를 fetch Header 형태로 직렬화
  return entries.map((entry) => `${entry.name}=${entry.value}`).join("; ");
}

export default async function HomeRecommendationSectionServer({
  revalidateSeconds = 60,
}: HomeRecommendationSectionServerProps) {
  // 서버에서 현재 요청자의 쿠키를 읽어 개인화 추천 API에 전달
  const cookieStore = await cookies();
  const cookieHeader = toCookieHeader(cookieStore.getAll());
  const data = await getHomeMembersServer({
    cookieHeader,
    revalidate: revalidateSeconds,
  });

  // 서버 시드 데이터를 먼저 전달하고, 필요 시 클라이언트 경로로 복구 fetch
  return (
    <HomeRecommendationSectionClient
      initialMembers={toRecommendationMembers(data.members)}
    />
  );
}
