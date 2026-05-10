import MentorSkillForm from '../../components/MentorSkillForm';

export default function MentorDashboard() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-white text-center mt-10 text-3xl font-bold mb-8">Mentor Dashboard</h1>
      <MentorSkillForm />
    </div>
  );
}
