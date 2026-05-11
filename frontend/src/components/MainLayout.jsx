import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#080710] flex flex-col">
      <Navbar />
      
      {/* Contenedor principal que se inyectarán las Pages */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
}