"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown, Github } from "lucide-react"
import { SparkleIcon } from "@/components/sparkle-icon"

export function ModernHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-4">
      <div
        className={`mx-auto max-w-6xl transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg border border-gray-200/50"
            : "bg-white/90 backdrop-blur-sm shadow-md border border-gray-200/30"
        } rounded-2xl`}
      >
        <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <SparkleIcon
                size={20}
                className="text-gray-900"
              />
              <span className="text-lg sm:text-xl font-semibold text-gray-900">
                Serif
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on mobile and tablet */}
          <nav className="hidden xl:flex xl:items-center xl:space-x-6 2xl:space-x-8">
            <div className="relative group">
              <button className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                <span>Features</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <Link
              href="/customers"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Customers
            </Link>
            <Link
              href="/enterprise"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Enterprise
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/settings"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Settings
            </Link>
          </nav>

          {/* Desktop Right Section - Responsive visibility */}
          <div className="hidden xl:flex xl:items-center xl:space-x-3 2xl:space-x-4">
            {/* Social Links */}
            <div className="flex items-center space-x-2 2xl:space-x-3">
              <a
                href="#"
                className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                title="Discord"
              >
                <div className="w-5 h-5 bg-gray-800 rounded-sm flex items-center justify-center">
                  <span className="text-white text-xs font-bold">D</span>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                title="GitHub"
              >
                <Github className="h-4 w-4" />
                <span className="hidden 2xl:inline">32.5k</span>
              </a>
              <a
                href="#"
                className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                title="Website"
              >
                <Image
                  src="/globe.svg"
                  alt="Globe"
                  width={16}
                  height={16}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                />
              </a>
            </div>
            
            <div className="w-px h-6 bg-gray-300 hidden 2xl:block"></div>
            
            <Link
              href="/contact"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors hidden 2xl:inline-block"
            >
              Contact sales
            </Link>
            
            <Link href="/auth/sign-up">
              <Button
                className="bg-black hover:bg-gray-800 text-white text-sm font-medium px-3 py-1.5 2xl:px-4 2xl:py-2 rounded-lg transition-colors"
              >
                Sign up →
              </Button>
            </Link>
          </div>

          {/* Tablet Right Section - Visible on medium to large screens */}
          <div className="hidden lg:flex xl:hidden lg:items-center lg:space-x-3">
            <div className="flex items-center space-x-2">
              <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors" title="Discord">
                <div className="w-5 h-5 bg-gray-800 rounded-sm flex items-center justify-center">
                  <span className="text-white text-xs font-bold">D</span>
                </div>
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors" title="GitHub">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors" title="Website">
                <Image src="/globe.svg" alt="Globe" width={16} height={16} className="opacity-60 hover:opacity-100 transition-opacity" />
              </a>
            </div>
            <Link href="/auth/sign-up">
              <Button className="bg-black hover:bg-gray-800 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
                Sign up →
              </Button>
            </Link>
          </div>

          {/* Mobile Right Section - Sign up button + Menu */}
          <div className="flex lg:hidden items-center space-x-2">
            <Link href="/auth/sign-up" className="hidden sm:block">
              <Button
                size="sm"
                className="bg-black hover:bg-gray-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                Sign up
              </Button>
            </Link>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

      </div>
      
      {/* Mobile Navigation Menu - Enhanced */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-2">
          <div className="mx-auto max-w-6xl bg-white/95 backdrop-blur-md shadow-lg border border-gray-200/50 rounded-2xl">
            {/* Navigation Links */}
            <div className="px-6 py-4 space-y-1">
                <div className="py-2">
                  <button className="flex items-center justify-between w-full text-left text-base font-medium text-gray-900 hover:text-gray-700 transition-colors py-2">
                    <span>Features</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <Link
                  href="/customers"
                  className="block text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Customers
                </Link>
                <Link
                  href="/enterprise"
                  className="block text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Enterprise
                </Link>
                <Link
                  href="/pricing"
                  className="block text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="/docs"
                  className="block text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Docs
                </Link>
                <Link
                  href="/settings"
                  className="block text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Settings
                </Link>
              </div>
              
            
            {/* Bottom Section */}
            <div className="border-t border-gray-200/50 px-6 py-4 space-y-4">
                {/* Social Links */}
                <div className="flex items-center justify-center space-x-6">
                  <a
                    href="#"
                    className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    title="Discord"
                  >
                    <div className="w-5 h-5 bg-gray-800 rounded-sm flex items-center justify-center">
                      <span className="text-white text-xs font-bold">D</span>
                    </div>
                    <span>Discord</span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    title="GitHub"
                  >
                    <Github className="h-4 w-4" />
                    <span>32.5k</span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    title="Website"
                  >
                    <Image src="/globe.svg" alt="Globe" width={16} height={16} className="opacity-60" />
                    <span>Website</span>
                  </a>
                </div>
                
                <Link
                  href="/contact"
                  className="block text-center text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 py-2 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact sales
                </Link>
                
                {/* Mobile Sign up button - Show only on very small screens */}
                <div className="sm:hidden">
                  <Link href="/auth/sign-up" className="block">
                    <Button
                      className="w-full bg-black hover:bg-gray-800 text-white text-base font-medium py-3 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign up →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
    </header>
  )
}
