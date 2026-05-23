import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function MainLayout() {
  return (
    // bg-background para el modo claro (Gris azulado/slate muy sutil) 
    // dark:bg-plomo-darkCanvas para el modo oscuro (#141414)
    <div className="min-h-screen bg-background dark:bg-plomo-darkCanvas flex flex-col transition-colors duration-300">
      <Navbar />
      
      {/* Contenedor principal donde se inyectan las páginas */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
}