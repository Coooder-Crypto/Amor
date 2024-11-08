"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const Header = () => {
  return (
    <div className="w-full border-b border-gray-600 flex flex-row items-center justify-between h-[100px]">
      <h1 className="text-4xl font-bold mb-4 md:mb-0">Amor</h1>
      <div className="mt-4 md:mt-0">
        <ConnectButton />
      </div>
    </div>
  );
};

export default Header;
