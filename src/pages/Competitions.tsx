import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Competition, CompetitionParticipant, Profile } from '../lib/supabase';
import { Trophy, Plus, Users, Calendar, Loader2, Check, X, Copy } from 'lucide-react';

export default function Competitions() {
  const { profile } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [participants, setParticipants] = useState<Record<string, (CompetitionParticipant & { profile?: Profile })[]>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState<string | null>(null);
  const [inviteUserId, setInviteUserId] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal_type: 'lose_weight',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchCompetitions();
  }, [profile]);

  const fetchCompetitions = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { data: comps } = await supabase
        .from('competitions')
        .select('*')
        .order('created_at', { ascending: false });

      if (comps) {
        setCompetitions(comps);

        const participantsData: Record<string, (CompetitionParticipant & { profile?: Profile })[]> = {};
        for (const comp of comps) {
          const { data: parts } = await supabase
            .from('competition_participants')
            .select('*')
            .eq('competition_id', comp.id);

          if (parts) {
            const partsWithProfiles = await Promise.all(
              parts.map(async (part) => {
                const { data: userProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', part.user_id)
                  .maybeSingle();
                return { ...part, profile: userProfile || undefined };
              })
            );
            participantsData[comp.id] = partsWithProfiles;
          }
        }
        setParticipants(participantsData);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: comp } = await supabase
      .from('competitions')
      .insert({
        creator_id: profile!.id,
        name: formData.name,
        description: formData.description,
        goal_type: formData.goal_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: 'active',
      })
      .select()
      .single();

    if (comp) {
      await supabase.from('competition_participants').insert({
        competition_id: comp.id,
        user_id: profile!.id,
        status: 'accepted',
        initial_weight: profile?.current_weight,
        current_weight: profile?.current_weight,
        points: 0,
      });
    }

    setFormData({
      name: '',
      description: '',
      goal_type: 'lose_weight',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setShowCreate(false);
    fetchCompetitions();
  };

  const handleInviteUser = async (competitionId: string) => {
    if (!inviteUserId.trim()) return;

    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', inviteUserId.trim())
        .maybeSingle();

      if (!userProfile) {
        alert('Usuário não encontrado!');
        return;
      }

      await supabase.from('competition_participants').insert({
        competition_id: competitionId,
        user_id: inviteUserId.trim(),
        status: 'pending',
        initial_weight: userProfile.current_weight,
        current_weight: userProfile.current_weight,
        points: 0,
      });

      setInviteUserId('');
      setShowInvite(null);
      fetchCompetitions();
    } catch (error) {
      console.error('Error inviting user:', error);
    }
  };

  const handleAcceptInvite = async (participantId: string) => {
    await supabase
      .from('competition_participants')
      .update({ status: 'accepted' })
      .eq('id', participantId);

    fetchCompetitions();
  };

  const handleDeclineInvite = async (participantId: string) => {
    await supabase
      .from('competition_participants')
      .update({ status: 'declined' })
      .eq('id', participantId);

    fetchCompetitions();
  };

  const copyUserId = () => {
    if (profile) {
      navigator.clipboard.writeText(profile.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Competições</h1>
            <p className="text-gray-600 mt-1">
              Desafie amigos e acompanhe o ranking
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Competição
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Seu ID de Usuário</h3>
              <p className="text-sm text-blue-800 font-mono">{profile?.id}</p>
              <p className="text-xs text-blue-700 mt-1">
                Compartilhe esse ID com amigos para receber convites
              </p>
            </div>
            <button
              onClick={copyUserId}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              {copiedId ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>

        {showCreate && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Criar Nova Competição
            </h2>
            <form onSubmit={handleCreateCompetition} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Competição
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objetivo
                </label>
                <select
                  value={formData.goal_type}
                  onChange={(e) =>
                    setFormData({ ...formData, goal_type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="lose_weight">Perder Peso</option>
                  <option value="gain_muscle">Ganhar Massa Muscular</option>
                  <option value="maintain">Manter Peso</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-6">
          {competitions.map((comp) => {
            const compParticipants = participants[comp.id] || [];
            const myParticipation = compParticipants.find((p) => p.user_id === profile?.id);
            const isCreator = comp.creator_id === profile?.id;

            return (
              <div key={comp.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                      <h2 className="text-xl font-bold text-gray-900">
                        {comp.name}
                      </h2>
                      {isCreator && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          Criador
                        </span>
                      )}
                    </div>
                    {comp.description && (
                      <p className="text-gray-600 mt-2">{comp.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(comp.start_date).toLocaleDateString('pt-BR')} -{' '}
                        {new Date(comp.end_date).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {compParticipants.filter((p) => p.status === 'accepted').length}{' '}
                        participantes
                      </span>
                    </div>
                  </div>

                  {isCreator && (
                    <button
                      onClick={() =>
                        setShowInvite(showInvite === comp.id ? null : comp.id)
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 text-sm"
                    >
                      Convidar
                    </button>
                  )}
                </div>

                {showInvite === comp.id && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID do Usuário para Convidar
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={inviteUserId}
                        onChange={(e) => setInviteUserId(e.target.value)}
                        placeholder="Cole o ID do usuário aqui"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleInviteUser(comp.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                      >
                        Enviar Convite
                      </button>
                    </div>
                  </div>
                )}

                {myParticipation?.status === 'pending' && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 mb-3">
                      Você foi convidado para participar desta competição
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptInvite(myParticipation.id)}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Aceitar
                      </button>
                      <button
                        onClick={() => handleDeclineInvite(myParticipation.id)}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Recusar
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Ranking</h3>
                  {compParticipants
                    .filter((p) => p.status === 'accepted')
                    .sort((a, b) => b.points - a.points)
                    .map((participant, index) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              index === 0
                                ? 'bg-yellow-500 text-white'
                                : index === 1
                                ? 'bg-gray-400 text-white'
                                : index === 2
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {participant.profile?.full_name || 'Usuário'}
                              {participant.user_id === profile?.id && (
                                <span className="ml-2 text-xs text-blue-600">(você)</span>
                              )}
                            </p>
                            {participant.current_weight && (
                              <p className="text-sm text-gray-500">
                                Peso: {participant.current_weight} kg
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {participant.points} pts
                          </p>
                        </div>
                      </div>
                    ))}

                  {compParticipants.filter((p) => p.status === 'accepted').length ===
                    0 && (
                    <p className="text-center text-gray-500 py-4">
                      Nenhum participante ainda
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {competitions.length === 0 && (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Nenhuma competição ainda
              </h3>
              <p className="text-gray-600 mb-6">
                Crie uma competição e convide seus amigos para competir!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
