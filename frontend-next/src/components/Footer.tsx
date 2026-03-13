import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[var(--color-bg-primary)] border-t border-[var(--color-border)] mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8">
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-black mb-2">
              Tienda
            </h4>
            <Link
              href="/categories?gender=men"
              className="text-sm text-[var(--color-text-secondary)] hover:text-black transition-colors"
            >
              Hombre
            </Link>
            <Link
              href="/categories?gender=women"
              className="text-sm text-[var(--color-text-secondary)] hover:text-black transition-colors"
            >
              Mujer
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-black mb-2">
              Soporte
            </h4>
            <Link
              href="#"
              className="text-sm text-[var(--color-text-secondary)] hover:text-black transition-colors"
            >
              Contáctanos
            </Link>
            <Link
              href="#"
              className="text-sm text-[var(--color-text-secondary)] hover:text-black transition-colors"
            >
              Envíos
            </Link>
            <Link
              href="#"
              className="text-sm text-[var(--color-text-secondary)] hover:text-black transition-colors"
            >
              Devoluciones
            </Link>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-[var(--color-border-light)] text-center">
          <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-widest">
            © 2026 DRIZO. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
