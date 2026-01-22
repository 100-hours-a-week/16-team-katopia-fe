export default function ProfilePostGrid() {
  const dummy = Array.from({ length: 6 });

  return (
    <section className="grid grid-cols-3 gap-3 px-4">
      {dummy.map((_, i) => (
        <div key={i} className="aspect-[3/4] rounded bg-gray-200" />
      ))}
    </section>
  );
}
