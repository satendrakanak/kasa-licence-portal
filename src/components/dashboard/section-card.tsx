import type { ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  className?: string;
};

export function SectionCard({ children, className = "" }: SectionCardProps) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20 md:p-6 ${className}`}>
      {children}
    </section>
  );
}

export function SectionTitle({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon ? <div className="mt-1 text-emerald-300">{icon}</div> : null}
      <div>
        <h2 className="text-xl font-semibold text-white md:text-2xl">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
