interface Props {
  query: string;
}

export default function SearchResultEmpty({ query }: Props) {
  return (
    <div className="mt-24 px-6 text-center text-sm text-muted-foreground">
      {/* 메인 메시지 */}
      <p className="mb-6 text-[14px] text-gray-500">
        <span className="font-medium text-gray-700">“{query}”</span>에 일치하는
        검색 결과가 없습니다.
      </p>

      {/* 안내 문구 */}
      <ul className="space-y-2 text-[13px] text-gray-400 text-left inline-block">
        <li>• 단어의 철자가 정확한지 확인해 보세요.</li>
        <li>• 한글을 영어로 혹은 영어를 한글로 입력했는지 확인해 보세요.</li>
        <li>• 검색 옵션을 변경해서 다시 검색해 보세요.</li>
      </ul>
    </div>
  );
}
