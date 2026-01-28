"use client";
import React from 'react';
import { Mail, Phone, MessageCircle, Facebook, Smartphone } from 'lucide-react';
import { Mallanna } from "next/font/google";

const mallanna = Mallanna({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});


const Section5 = () => {
  return (
    <section id="section5" className={mallanna.className}>
    <div className=" text-[#3E5481] relative w-full flex items-center bg-gradient-to-r from-[#FFA94D] from-20% via-[#56DEF3] to-[#BCEAD3] to-90% mt-50">
      
      <div className="hidden lg:flex absolute bottom-10 left-1/2 transform -translate-x-1/1 z-0 pointer-events-none items-center justify-center w-[450px] h-auto ms-35 ">
          <img 
            src="/woman.png" 
            alt="Woman holding dog" 
            className="w-full h-auto object-contain drop-shadow-2xl translate-y-10" 
          />
      </div>
      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-12">
        
        {/* Left Column: Contact Info */}
        <div className="text-white space-y-8 pl-4 lg:pl-20">
          <h2 className="text-5xl font-bold tracking-wide">
            Contact Us
          </h2>
          
          <div className="space-y-6 text-sm md:text-base font-medium">
            {/* Email Block */}
            <div className="flex items-start gap-4">
              <div className="mt-1">
               <img src="/ic_baseline-email.png" alt="Email" className="w-8 h-8 object-contain" />
              </div>
              <div className="space-y-1">
                  <p>Thipthanya0879@gmail.com</p>
                  <p>Deemeesri456@gmail.com</p>
              </div>
            </div>

            {/* Phone Block */}
            <div className="flex items-start gap-4">
              <div className="bg-transparent pt-1">
                 <img src="/mingcute_phone-fill.png" alt="Phone" className="w-8 h-8 object-contain" />
              </div>
              <div className="space-y-1">
                  <p>+66 92 978 7905</p>
                  <p>+66 0 90 215 8179</p>
              </div>
            </div>

            {/* Line Block */}
            <div className="flex items-start gap-4">
              <div className=" mt-1">
                <img src="/mage_line.png" alt="Line" className="w-8 h-8 object-contain" />
              </div>
              <div className="space-y-1">
                  <p>Thipthanya35688</p>
                  <p>Poazw2</p>
              </div>
            </div>

            {/* Facebook Block */}
            <div className="flex items-start gap-4">
               <div className="mt-1">
                    <img src="/fe_facebook.png" alt="Facebook" className="w-8 h-8 object-contain" />
               </div>
               <div className="space-y-1">
                  <p>Fern Thipthanya</p>
                  <p>Tawan Tiddyyums</p>
               </div>
            </div>
          </div>
          
          {/* Logo/Brand at bottom left corner */}
          <div className="pt-8">
      
          </div>
        </div>

        {/* Right Column: Form (Light Blue Card) */}
        <div className="flex justify-center lg:justify-end pr-4 lg:pr-20">
          <div className="bg-[#D1F9F6] rounded-[2rem] p-8 w-full max-w-md shadow-lg border-4 border-[#D1F9F6]">
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full bg-[#C3F4F0] border border-none rounded-full px-6 py-3  placeholder-[#425B80] text-[#425B80] focus:outline-none focus:none "
                />
              </div>
              <div> 
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full bg-[#C3F4F0] border border-none rounded-full px-6 py-3  placeholder-[#425B80] text-[#425B80] focus:outline-none focus:none"
                />
              </div>
              <div>
                <textarea
                  placeholder="Message"
                  rows={5}
                  className="w-full bg-[#C3F4F0] border border-none rounded-[1.5rem] px-6 py-4 placeholder-[#425B80] text-[#425B80] focus:outline-none focus:none resize-none"
                ></textarea>
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-50  bg-linear-to-r from-[#56DEF3] to-[#B6E9D4] text-white font-bold text-lg py-3 px-1 rounded-full "

                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    </section>
  );
};

export default Section5;