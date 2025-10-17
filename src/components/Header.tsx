"use client";
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { FaFacebook, FaTiktok, FaYoutube } from "react-icons/fa";
import { GrGroup } from "react-icons/gr";
import { usePathname } from "next/navigation";
import Link from "next/link";
import config from "@/config";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, Phone, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const Header: React.FC = () => {
  const router = useRouter();
  const [isCourseDropdownVisible, setCourseDropdownVisible] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isDropdownVisible, setDropdownVisible] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const pathname = usePathname();
  const [isCourseSubOpen, setCourseSubOpen] = useState(false);
  const [isServiceSubOpen, setServiceSubOpen] = useState(false);

  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const { data: session } = useSession();
  const user = session?.user;

  const handleRouteChange = (href: string) => {
    if (pathname === href) {
      setMobileMenuOpen(false);
    } else {
      router.push(href);
    }
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  useLayoutEffect(() => {
    setIsMobile(window.innerWidth <= 860);
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setDropdownVisible(false);
  }, [pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    setCourseDropdownVisible(false);
    setDropdownVisible(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      const isNowMobile = window.innerWidth <= 860;
      setIsMobile(isNowMobile);

      if (!isNowMobile && isMobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !toggleButtonRef.current?.contains(event.target as Node)
      ) {
        setDropdownVisible(false);
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("click", handleClickOutside);

    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between p-4 text-white bg-black">
      <div className="flex items-center space-x-2">
        <Link href="/dashboard">
          <img
            src="/images/logo.png"
            alt="Logo"
            className="w-10 h-10 cursor-pointer"
          />
        </Link>
        <Link href="/dashboard">
          <div className=" font-black italic text-2xl cursor-pointer">
            {config.companyName}
          </div>
        </Link>
      </div>
      {hasMounted && (
        <div
          className={`flex ${
            isMobile ? "ml-auto space-x-2" : "ml-auto space-x-10"
          }`}
        >
          {!isMobile && (
            <>
              <Link
                href="/dashboard"
                className="text-white hover:text-[#168bb9]"
              >
                Thống kê
              </Link>
              <Link href="/user" className="text-white hover:text-[#168bb9]">
                Người dùng
              </Link>

              <Link href="/course" className="text-white hover:text-[#168bb9]">
                Khóa học
              </Link>
              <Link href="/lesson" className="text-white hover:text-[#168bb9]">
                Bài học
              </Link>
              <Link href="/people" className="text-white hover:text-[#168bb9]">
                Đội ngũ
              </Link>

              {user && !isMobile && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 bg-[#168bb9] hover:bg-[#11779d] text-white px-4 py-1 rounded-full font-medium shadow transition duration-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.121 17.804A13.937 13.937 0 0112 15c2.21 0 4.29.537 6.121 1.486M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{user.name}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1f] border border-gray-600 rounded-lg shadow-lg py-2 z-50">
                      <Link
                        href="/changePassword"
                        className="block w-full text-left px-4 py-2 text-white hover:bg-[#2c2c33]"
                      >
                        Đổi mật khẩu
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="block w-full text-left px-4 py-2 text-white hover:bg-[#2c2c33]"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="flex items-center space-x-4">
        {isMobile && (
          <button
            className="text-white text-2xl"
            onClick={() => setMobileMenuOpen(true)}
          >
            ☰
          </button>
        )}
      </div>

      {isAuthOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <button
              onClick={() => setIsAuthOpen(false)}
              className="absolute top-3 right-4 text-gray-600 hover:text-red-500"
            >
              ✕
            </button>
            <div className="w-full"></div>
          </div>
        </div>
      )}

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Side menu */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-0 right-0 h-full w-[80%] max-w-xs bg-[#1a1a1f] text-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-600">
          <div className="flex items-center space-x-2">
            <img src="/images/logo.png" alt="TJZenn" className="h-10 w-auto" />
            <div className="flex flex-col leading-tight">
              <span className="text-2xl tracking-wide font-black italic">
                {config.companyName}
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-col px-4 text-lg font-semibold space-y-2">
          {user && (
            <>
              <div className="flex items-center space-x-3 px-4 py-2 bg-[#2c2c33] rounded-xl mt-2 text-white shadow-inner">
                <div className="bg-[#168bb9] text-white rounded-full h-8 w-8 flex items-center justify-center font-semibold uppercase">
                  {user.name.charAt(0)}
                </div>
                <div className="text-base font-medium truncate">
                  <span className="text-[#79d4f6]">{user.name}</span>
                </div>
              </div>
            </>
          )}
          {/* <hr className="border-gray-" /> */}
          <button
            onClick={() => handleRouteChange("/dashboard")}
            className="text-left"
          >
            Thống kê
          </button>

          <button
            onClick={() => handleRouteChange("/user")}
            className="text-left"
          >
            Người dùng
          </button>

          <button
            onClick={() => handleRouteChange("/course")}
            className="text-left"
          >
            Khóa học
          </button>
          <button
            onClick={() => handleRouteChange("/lesson")}
            className="text-left"
          >
            Bài học
          </button>
          <button
            onClick={() => handleRouteChange("/people")}
            className="text-left"
          >
            Nhân sự
          </button>
          <button
            onClick={() => handleRouteChange("/changePassword")}
            className="text-left"
          >
            Đổi mật khẩu
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              signOut();
            }}
            className="text-left text-red-400"
          >
            Đăng xuất
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
