"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import Logo from "../Logo/Logo";
import Navigation from "../Navigation/Navigation";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="topbar">
      <Logo />
      <Navigation open={menuOpen} />
      <div className="system-state"><span /><div><b>Modo prototipo</b><small>Datos locales</small></div></div>
      <button className="mobile-menu" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}>
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </header>
  );
}
