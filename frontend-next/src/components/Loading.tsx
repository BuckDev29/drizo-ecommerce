export default function Loading({
  fullScreen = false,
}: {
  fullScreen?: boolean;
}) {
  return (
    <div
      className={`flex justify-center items-center ${
        fullScreen ? "min-h-screen" : "min-h-[50vh]"
      }`}
    >
      <div className="w-10 h-10 border-[3px] border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin" />
    </div>
  );
}
