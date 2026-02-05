export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://dev.fitcheck.kr";
export const IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL ??
  "https://df1ez4kkj7703.cloudfront.net";
export const KAKAO_OAUTH_URL = `${API_BASE_URL}/oauth2/authorization/kakao`;
