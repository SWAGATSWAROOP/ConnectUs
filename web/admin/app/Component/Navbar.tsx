"use client";

import Image from "next/image";
import Link from "next/link";

type NavbarProps = {
  menu?: boolean; // optional prop
};

export default function Navbar({ menu = false }: NavbarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-2 bg-white shadow-md">
      <Image
        src="/connectus_web.png"
        alt="ConnectUs Logo"
        height={200}
        width={200}
        className="object-contain"
      />

      {menu && (
        <Link href="/">
          <button className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
            Menu
          </button>
        </Link>
      )}
    </div>
  );
}
