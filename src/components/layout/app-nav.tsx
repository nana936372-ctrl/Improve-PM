import { Dumbbell, LogOut, Settings, TrendingUp } from "lucide-react";
import Link from "next/link";

export function AppNav() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="font-semibold text-ink">
          AI PM Trainer
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link className="flex items-center gap-1 rounded px-3 py-2 hover:bg-panel" href="/dashboard">
            <Dumbbell size={16} /> 训练
          </Link>
          <Link className="flex items-center gap-1 rounded px-3 py-2 hover:bg-panel" href="/history">
            <TrendingUp size={16} /> 成长
          </Link>
          <Link className="flex items-center gap-1 rounded px-3 py-2 hover:bg-panel" href="/settings">
            <Settings size={16} /> 设置
          </Link>
          <form action="/auth/signout" method="post">
            <button className="flex items-center gap-1 rounded px-3 py-2 hover:bg-panel" type="submit">
              <LogOut size={16} /> 退出
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
