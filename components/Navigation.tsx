"use client";

import { useState } from "react";

export default function Navigation() {
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const useCases = [
        { label: "for Founders", href: "#" },
        { label: "for Product Managers", href: "#" },
        { label: "for Designers", href: "#" },
        { label: "for Marketers", href: "#" },
        { label: "Prototyping", href: "#" },
        { label: "Internal Tools", href: "#" },
    ];

    const resources = [
        { label: "Learn", href: "#" },
        { label: "Templates", href: "#" },
        { label: "Guides", href: "#" },
        { label: "Videos", href: "#" },
        { label: "Blog", href: "#" },
    ];

    return (
        <header className="relative z-50 mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <div className="flex items-center gap-2 text-white">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-tr from-pink-500 to-orange-400" />
                <span className="text-lg font-semibold">Lovable</span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-300">
                {/* Use Cases Dropdown */}
                <div
                    className="relative"
                    onMouseEnter={() => setActiveDropdown("usecases")}
                    onMouseLeave={() => setActiveDropdown(null)}
                >
                    <button className="flex items-center gap-1 hover:text-white transition-colors">
                        Use Cases
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </button>
                    {activeDropdown === "usecases" && (
                        <div className="absolute top-full left-0 mt-2 w-56 rounded-lg border border-white/10 bg-neutral-900/95 backdrop-blur-xl shadow-2xl">
                            <div className="p-2">
                                {useCases.map((item) => (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        className="block rounded-md px-3 py-2 text-sm text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        {item.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Resources Dropdown */}
                <div
                    className="relative"
                    onMouseEnter={() => setActiveDropdown("resources")}
                    onMouseLeave={() => setActiveDropdown(null)}
                >
                    <button className="flex items-center gap-1 hover:text-white transition-colors">
                        Resources
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </button>
                    {activeDropdown === "resources" && (
                        <div className="absolute top-full left-0 mt-2 w-48 rounded-lg border border-white/10 bg-neutral-900/95 backdrop-blur-xl shadow-2xl">
                            <div className="p-2">
                                {resources.map((item) => (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        className="block rounded-md px-3 py-2 text-sm text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        {item.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <a href="#" className="hover:text-white transition-colors">
                    Community
                </a>
                <a href="#" className="hover:text-white transition-colors">
                    Pricing
                </a>
                <a href="#" className="hover:text-white transition-colors">
                    Enterprise
                </a>
            </nav>

            <div className="flex items-center gap-3">
                <a
                    className="rounded-md bg-white/10 px-4 py-2 text-sm text-white backdrop-blur hover:bg-white/20 transition-all duration-200"
                    href="#"
                >
                    Log in
                </a>
                <a
                    className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-100 transition-all duration-200 shadow-lg hover:shadow-xl"
                    href="#"
                >
                    Get started
                </a>
            </div>
        </header>
    );
}
