import Link from "next/link";
import { Camera, ShieldCheck, Heart } from "lucide-react";

export default function Footer({ storeName = "PhotoPlus Studio" }: { storeName?: string }) {
  return (
    <footer className="w-full bg-neutral-900 text-neutral-400 border-t border-neutral-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white">
                <Camera className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-white">{storeName}</span>
            </div>
            <p className="text-sm text-neutral-400 max-w-sm">
              Plataforma profesional de fotografía sincronizada en tiempo real con Google Drive.
              Venta individual de fotografías digitales en alta resolución con entrega inmediata.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Seguridad</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Marcas de agua dinámicas</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Pagos con Mercado Pago</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Descargas seguras con token</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Enlaces</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Panel Administrador
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Creado para fotógrafos con Next.js y Google Drive
          </p>
        </div>
      </div>
    </footer>
  );
}
