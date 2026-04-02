export default function Footer() {
  return (
    <footer className="w-full bg-black/30 backdrop-blur-xl border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-sm font-semibold bg-gradient-to-r from-[#e94560] to-[#c23616] bg-clip-text text-transparent">
          X-flex Pvt Ltd
        </span>
        <span className="text-xs text-white/40">
          &copy; {new Date().getFullYear()} All rights reserved.
        </span>
      </div>
    </footer>
  );
}
