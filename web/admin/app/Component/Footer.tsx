"use client";

import {  FaLinkedin } from "react-icons/fa";

const Footer = () => {
  const socialLinks = {
    linkedin:
      "https://www.linkedin.com/school/dr.-b-r-ambedkar-national-institute-of-tchnology-jalandhar-punjab-/posts/?feedView=all",
  };

  return (
    <footer className="bg-black text-gray-300 py-2 px-4">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-2">
        <p className="font-semibold text-sm text-gray-400">
          Bh-4 NITJ Jalandhar, G.T Road, Amritsar Bypass, Jalandhar, Punjab, India-144008
        </p> 
      </div>

      {/* Social Icons */}
      <div className="flex justify-center items-center mt-1 space-x-6"> 
        
      <p className="text-sm text-gray-500">
          +91 7983228557
        </p>
        <FaLinkedin
          className="text-gray-400 hover:text-white transition cursor-pointer text-xl"
          onClick={() => window.open(socialLinks.linkedin, "_blank")}
        />
      </div>

      <div className="text-center text-sm mt-2 text-gray-500">
        <p>
          ©️ {new Date().getFullYear()} ConnectUs
        </p>
      </div>
    </footer>
  );
};

export default Footer;
