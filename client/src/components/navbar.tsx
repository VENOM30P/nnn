import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ShoppingCart, LogOut, UserCog } from "lucide-react";

export function Navbar() {
  const { user, logoutMutation } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <a className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Once 11
            </a>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/subscription">
            <a className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Once 11+ Premium
            </a>
          </Link>

          {/* Show admin link only to user with ID 1 */}
          {user?.id === 1 && (
            <Link href="/admin">
              <a className="p-2 hover:bg-gray-100 rounded-full" title="Admin Panel">
                <UserCog className="h-5 w-5 text-gray-700" />
              </a>
            </Link>
          )}

          <Link href="/cart">
            <a className="p-2 hover:bg-gray-100 rounded-full">
              <ShoppingCart className="h-5 w-5 text-gray-700" />
            </a>
          </Link>

          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}