import { useFormContext } from "react-hook-form";

export default function PostSubmitButton({ disabled }: { disabled: boolean }) {
  const {
    formState: { isValid },
  } = useFormContext();

  return (
    <button
      type="submit"
      disabled={!isValid || disabled}
      className="fixed top-4 right-4 font-semibold"
    >
      완료
    </button>
  );
}
