export const API_BASE_URL = "https://dev.fitcheck.kr";
// export const API_BASE_URL = "http://localhost:8080";
// https://dev.fitcheck.kr/oauth2/authorization/kakao

export const KAKAO_OAUTH_URL =
  process.env.NEXT_PUBLIC_KAKAO_OAUTH_URL ||
  "https://dev.fitcheck.kr/oauth2/authorization/kakao";

// // const profile = 'local';
// const profile = 'dev';

// if (profile === 'local') {
//   // localhost 환경에서만 동작하는 코드
// } else if (profile === 'dev') {
//   // dev 환경에서만 동작하는 코드
// }
