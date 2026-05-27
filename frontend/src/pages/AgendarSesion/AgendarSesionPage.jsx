import AgendarSesionUI from './AgendarSesionUI';
import { useAgendamiento } from '../../hooks/useAgendamiento';

export default function AgendarSesionPage() {
  const agendamiento = useAgendamiento();
  return <AgendarSesionUI {...agendamiento} />;
}