import MemoryHelper from '@/components/MemoryHelper';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, ArrowLeft } from 'lucide-react';

export default function MemoryHelperPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9]">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-3 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-sm text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              뒤로
            </button>
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Brain className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold text-foreground">NeuroScan</span>
            </Link>
          </div>
        </div>
      </header>
      <MemoryHelper />
    </div>
  );
}




