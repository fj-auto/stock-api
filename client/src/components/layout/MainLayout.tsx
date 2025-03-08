// src/components/layout/MainLayout.tsx
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, LineChart, BarChart2, Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from './ThemeToggle';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { path: '/', label: '首页', icon: <Home className="h-4 w-4 mr-2" /> },
    { path: '/market', label: '市场概览', icon: <BarChart2 className="h-4 w-4 mr-2" /> },
    { path: '/search', label: '股票搜索', icon: <Search className="h-4 w-4 mr-2" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* 导航栏 */}
      <header className="border-b sticky top-0 z-50 bg-background">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            {/* 移动端菜单 */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden mr-2">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex flex-col space-y-4 mt-8">
                  {navItems.map(item => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center px-3 py-2 rounded-md ${
                        location.pathname === item.path
                          ? 'bg-muted font-medium'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex items-center">
              <LineChart className="h-6 w-6 mr-2" />
              <span className="font-bold text-xl">股票行情</span>
            </Link>

            {/* 桌面端导航 */}
            <nav className="hidden md:flex ml-8 space-x-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md ${
                    location.pathname === item.path ? 'bg-muted font-medium' : 'hover:bg-muted/50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 内容区域 */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 页脚 */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} 股票行情应用</p>
          <p className="mt-2">数据由Yahoo Finance提供</p>
        </div>
      </footer>
    </div>
  );
};
