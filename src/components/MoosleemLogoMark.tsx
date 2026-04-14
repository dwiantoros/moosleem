type MoosleemLogoMarkProps = {
  className?: string;
};

export default function MoosleemLogoMark({ className = '' }: MoosleemLogoMarkProps) {
  return (
    <p className={`text-[11px] font-semibold tracking-tight ${className}`.trim()} aria-label="Moosleem">
      <span className="bg-gradient-to-r from-teal-700 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
        Moosleem
      </span>
    </p>
  );
}