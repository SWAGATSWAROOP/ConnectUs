import { ReactNode } from "react";
import { FC } from "react";
import "../globals.css"; 


interface Auth_LayoutProps {
  children: ReactNode;
}

const Auth_Layout: FC<Auth_LayoutProps> = ({ children }) => {
  return (
    <>
      <div className="flex m-10 flex-col justify-center items-center ">
        <div className="rounded-md bg-gray-200 p-10">
          {children}</div>
      </div> 
    </>
  );
};

export default Auth_Layout;
