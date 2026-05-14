import React from 'react';
import MentorSkillForm from '../../components/MentorSkillForm';
import './MentorDashboard.css';

export default function MentorDashboard() {
  return (
    <div className="mentor-dash-bg">
      <div className="container mx-auto px-4">
        <header className="mentor-dash-header text-center">
          <h1>Mentor Dashboard</h1>
        </header>

        <main className="glass-container">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2 uppercase tracking-wider">
              Gestión de Habilidades
            </h2>
            <p className="text-gray-400 text-sm mb-8">
              Configura las tecnologías y áreas de experiencia que deseas enseñar a tus aprendices.
            </p>
          </div>
          
          <MentorSkillForm />
        </main>
      </div>
    </div>
  );
}