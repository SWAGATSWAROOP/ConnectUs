import { ReactNode } from "react";
import { FC } from "react";
import "../globals.css";
import Navbar from "../Component/Navbar";

interface Auth_LayoutProps {
  children: ReactNode;
}

const Auth_Layout: FC<Auth_LayoutProps> = ({ children }) => {
  return (
    <>
        <Navbar />
        <div className="flex h-screen flex-col justify-center items-center ">
        <div className="rounded-md bg-gray-400 p-10">
          {children}</div>
        </div>
    </>
  );
};

export default Auth_Layout;
